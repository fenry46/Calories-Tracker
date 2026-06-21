import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { AppButton } from "../components/AppButton";
import { LabeledField } from "../components/LabeledField";
import { useCalorieStore } from "../store/useCalorieStore";
import { uploadFoodImage, WebhookTimeoutError } from "../utils/imageUpload";
import { estimateFromText } from "../utils/estimateText";
import type { FoodEntry, ScanItem, ScanResult } from "../types/models";
import { colors, fonts, radius, spacing } from "../theme";
import type { RootStackScreenProps } from "../navigation/types";

type Props = RootStackScreenProps<"Camera">;
type Phase =
  | "capture"
  | "processing"
  | "preview"
  | "result"
  | "error"
  | "manual";
type Unit = "g" | "oz" | "cup";

export function CameraScreen({ navigation }: Props) {
  const addFoodEntry = useCalorieStore((s) => s.addFoodEntry);
  const removeFoodEntry = useCalorieStore((s) => s.removeFoodEntry);
  const entries = useCalorieStore((s) => s.entries);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>("capture");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{
    entry: FoodEntry;
    confidence: number;
    items: ScanItem[];
  } | null>(null);

  // Editable scan preview (shown before anything is saved). `draft` keeps the
  // model's confidence/notes; `items` is the editable per-component breakdown
  // (the source of truth for the saved name + total); `draftName` is the
  // whole-plate description used to re-estimate the entire list.
  const [draft, setDraft] = useState<ScanResult | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [draftName, setDraftName] = useState("");
  const [reestimating, setReestimating] = useState(false);
  const [reestimatingIdx, setReestimatingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [estimatingManual, setEstimatingManual] = useState(false);

  // manual entry fields
  const [manualName, setManualName] = useState("");
  const [manualCals, setManualCals] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualUnit, setManualUnit] = useState<Unit>("g");

  const processImage = async (uri: string) => {
    setPhase("processing");
    try {
      const res = await uploadFoodImage(uri);
      if (res.items.length === 0 || res.calories <= 0) {
        setErrorMsg(
          res.notes ||
            "We couldn't detect any food in that photo. Try again or log it manually."
        );
        setPhase("error");
        return;
      }
      // Show an editable preview — nothing is logged until the user confirms.
      setDraft(res);
      setItems(res.items);
      setDraftName(res.foodName);
      setPhase("preview");
    } catch (err) {
      setErrorMsg(
        err instanceof WebhookTimeoutError
          ? err.message
          : "Something went wrong while scanning. Please try again."
      );
      setPhase("error");
    }
  };

  // Sum of the editable items — the live totals shown and ultimately saved.
  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.estimatedCalories) || 0),
    0
  );
  const proteinTotal = items.reduce(
    (sum, it) => sum + (Number(it.estimatedProtein) || 0),
    0
  );

  // Re-run the WHOLE plate from the description via the text model, replacing
  // the item list. Keeps the user's typed description so they can keep refining.
  const reestimate = async () => {
    const desc = draftName.trim();
    if (!desc) {
      Alert.alert("Add a description", "Describe what you ate so we can re-estimate.");
      return;
    }
    setReestimating(true);
    try {
      const res = await estimateFromText(desc);
      if (res.items.length === 0 || res.calories <= 0) {
        Alert.alert(
          "Couldn't estimate that",
          res.notes || "Try describing the food and portions more specifically."
        );
        return;
      }
      setDraft(res);
      setItems(res.items);
    } catch (err) {
      Alert.alert(
        "Re-estimate failed",
        err instanceof WebhookTimeoutError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setReestimating(false);
    }
  };

  const updateItem = (index: number, patch: Partial<ScanItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { name: "", portion: "", estimatedCalories: 0, estimatedProtein: 0 },
    ]);

  // Re-estimate a single item's calories from its name + portion.
  const reestimateItem = async (index: number) => {
    const it = items[index];
    const desc = [it.name, it.portion].map((s) => s.trim()).filter(Boolean).join(", ");
    if (!desc) {
      Alert.alert("Add details", "Enter a name (and portion) for this item first.");
      return;
    }
    setReestimatingIdx(index);
    try {
      const res = await estimateFromText(desc);
      if (res.calories <= 0) {
        Alert.alert(
          "Couldn't estimate that",
          res.notes || "Try a more specific name or portion."
        );
        return;
      }
      updateItem(index, {
        estimatedCalories: res.calories,
        estimatedProtein: res.protein,
      });
    } catch (err) {
      Alert.alert(
        "Re-estimate failed",
        err instanceof WebhookTimeoutError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setReestimatingIdx(null);
    }
  };

  // Commit the previewed estimate. The food name is built from the item names
  // (falling back to the description); calories is the live item total.
  const saveDraft = async () => {
    const name =
      items.map((it) => it.name.trim()).filter(Boolean).join(", ") || draftName.trim();
    if (!name || itemsTotal <= 0) {
      Alert.alert("Check your entry", "Add at least one item with a name and calories.");
      return;
    }
    setSaving(true);
    const { entry, error } = await addFoodEntry(name, itemsTotal, proteinTotal);
    setSaving(false);
    if (error || !entry) {
      setErrorMsg(error ?? "Could not save the entry.");
      setPhase("error");
      return;
    }
    setResult({ entry, confidence: draft?.confidence ?? 1, items });
    setPhase("result");
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (photo?.uri) await processImage(photo.uri);
    } catch {
      setErrorMsg("Could not capture the photo.");
      setPhase("error");
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      await processImage(res.assets[0].uri);
    }
  };

  const undo = async () => {
    if (!result) return;
    const { error } = await removeFoodEntry(result.entry.id);
    if (error) Alert.alert("Undo failed", error);
    navigation.goBack();
  };

  const submitManual = async () => {
    const name = manualName.trim();
    if (!name) {
      Alert.alert("Check your entry", "Enter a food name.");
      return;
    }
    const qty = manualQty.trim();
    const cals = parseInt(manualCals, 10);

    // Calories left blank → estimate with the text model, then let the user
    // review/adjust in the same preview as a scan (saved on confirm).
    if (!manualCals.trim() || Number.isNaN(cals) || cals <= 0) {
      const description =
        qty && qty !== "0" ? `${qty} ${manualUnit} ${name}` : name;
      setEstimatingManual(true);
      try {
        const res = await estimateFromText(description);
        if (res.items.length === 0 || res.calories <= 0) {
          Alert.alert(
            "Couldn't estimate that",
            res.notes ||
              "Try a more specific name/portion, or enter the calories yourself."
          );
          return;
        }
        setDraft(res);
        setItems(res.items);
        setDraftName(description);
        setPhase("preview");
      } catch (err) {
        Alert.alert(
          "Estimate failed",
          err instanceof WebhookTimeoutError
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setEstimatingManual(false);
      }
      return;
    }

    // Calories provided → trust it, save directly. Quantity + unit are cosmetic,
    // folded into the stored food name.
    const label = qty && qty !== "0" ? `${name} (${qty} ${manualUnit})` : name;
    const { entry, error } = await addFoodEntry(label, cals);
    if (error || !entry) {
      Alert.alert("Could not save", error ?? "Try again.");
      return;
    }
    setResult({ entry, confidence: 1, items: [] });
    setPhase("result");
  };

  // ---- Render per phase ----
  if (phase === "capture") {
    if (!permission) {
      return <Centered><ActivityIndicator color={colors.primary} /></Centered>;
    }
    if (!permission.granted) {
      return (
        <Centered>
          <Text style={styles.infoTitle}>Camera access needed</Text>
          <Text style={styles.infoText}>
            Allow the camera to scan your food, or pick a photo from your gallery.
          </Text>
          <PrimaryButton label="Grant camera access" onPress={requestPermission} />
          <SecondaryButton label="Choose from gallery" onPress={pickFromGallery} />
          <SecondaryButton label="Enter manually" onPress={() => setPhase("manual")} />
          <CancelLink onPress={() => navigation.goBack()} />
        </Centered>
      );
    }
    return (
      <View style={styles.flex}>
        <CameraView ref={cameraRef} style={styles.flex} facing="back" />

        {/* Top bar: close + title */}
        <SafeAreaView style={styles.topOverlay} edges={["top"]}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
            <Text style={styles.scanTitle}>Scan your meal</Text>
            <View style={styles.closeBtn} />
          </View>
        </SafeAreaView>

        {/* Framing brackets */}
        <View style={styles.bracketsWrap} pointerEvents="none">
          <View style={[styles.bracket, styles.bracketTL]} />
          <View style={[styles.bracket, styles.bracketTR]} />
          <View style={[styles.bracket, styles.bracketBL]} />
          <View style={[styles.bracket, styles.bracketBR]} />
        </View>

        <SafeAreaView style={styles.cameraOverlay} edges={["bottom"]}>
          <Text style={styles.frameHint}>Center your plate in the frame</Text>
          <View style={styles.cameraControls}>
            <Pressable style={styles.sideBtn} onPress={pickFromGallery}>
              <Ionicons name="images-outline" size={22} color={colors.white} />
            </Pressable>
            <Pressable
              style={styles.shutter}
              onPress={takePhoto}
              accessibilityLabel="Take photo"
            />
            <View style={styles.sideBtn} />
          </View>
          <Pressable style={styles.manualLink} onPress={() => setPhase("manual")}>
            <Text style={styles.manualLinkText}>Enter manually instead</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === "processing") {
    return (
      <View style={styles.scanningWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.scanningTitle}>Analyzing your meal…</Text>
        <Text style={styles.scanningMono}>POST · n8n webhook</Text>
      </View>
    );
  }

  if (phase === "preview") {
    const busy = reestimating || saving || reestimatingIdx !== null;
    const lowConfidence = (draft?.confidence ?? 1) < 0.6;
    return (
      <SafeAreaView style={styles.manualSafe}>
        <ScrollView
          contentContainerStyle={styles.manualContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.manualTitle}>Review &amp; adjust</Text>
          <Text style={styles.previewHint}>
            Tweak any item below, or re-describe the whole plate. Calories from
            the AI — adjust for a more accurate count.
          </Text>

          <View style={styles.previewKcalCard}>
            <Text style={styles.previewKcalValue}>{itemsTotal}</Text>
            <Text style={styles.previewKcalUnit}>kcal total</Text>
            <View style={styles.previewProteinPill}>
              <Text style={styles.previewProteinText}>{proteinTotal} g protein</Text>
            </View>
          </View>

          {items.map((it, i) => (
            <View key={i} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                <TextInput
                  style={[styles.input, styles.itemNameInput]}
                  placeholder="Food name"
                  placeholderTextColor={colors.muted}
                  value={it.name}
                  onChangeText={(t) => updateItem(i, { name: t })}
                />
                <Pressable
                  onPress={() => removeItem(i)}
                  hitSlop={8}
                  style={styles.itemIconBtn}
                  accessibilityLabel="Remove item"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.itemBottomRow}>
                <TextInput
                  style={[styles.input, styles.itemPortionInput]}
                  placeholder="Portion (e.g. 1 potong)"
                  placeholderTextColor={colors.muted}
                  value={it.portion}
                  onChangeText={(t) => updateItem(i, { portion: t })}
                />
                <View style={styles.itemKcalWrap}>
                  <TextInput
                    style={[styles.input, styles.itemKcalInput]}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={it.estimatedCalories ? String(it.estimatedCalories) : ""}
                    onChangeText={(t) =>
                      updateItem(i, {
                        estimatedCalories: parseInt(t.replace(/[^0-9]/g, ""), 10) || 0,
                      })
                    }
                  />
                  <Text style={styles.itemKcalLabel}>kcal</Text>
                </View>
                <View style={styles.itemKcalWrap}>
                  <TextInput
                    style={[styles.input, styles.itemProteinInput]}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={it.estimatedProtein ? String(it.estimatedProtein) : ""}
                    onChangeText={(t) =>
                      updateItem(i, {
                        estimatedProtein: parseInt(t.replace(/[^0-9]/g, ""), 10) || 0,
                      })
                    }
                  />
                  <Text style={styles.itemProteinLabel}>g</Text>
                </View>
                <Pressable
                  onPress={() => reestimateItem(i)}
                  disabled={busy}
                  hitSlop={8}
                  style={styles.itemIconBtn}
                  accessibilityLabel="Re-estimate this item"
                >
                  {reestimatingIdx === i ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable onPress={addItem} style={styles.addItemBtn} disabled={busy}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addItemText}>Add item</Text>
          </Pressable>

          <LabeledField label="Re-estimate whole plate">
            <TextInput
              style={[styles.input, styles.previewInput]}
              placeholder="e.g. 1 plate nasi putih, 2 fried chicken thighs, sambal"
              placeholderTextColor={colors.muted}
              value={draftName}
              onChangeText={setDraftName}
              multiline
            />
          </LabeledField>
          <AppButton
            label="Re-estimate all from description"
            variant="outline"
            onPress={reestimate}
            loading={reestimating}
            disabled={saving || reestimatingIdx !== null}
            style={styles.manualSubmit}
          />

          {draft && (
            <Text style={styles.infoText}>
              Confidence: {Math.round(draft.confidence * 100)}%
              {lowConfidence ? " — double-check the items above." : ""}
            </Text>
          )}

          <AppButton
            label="Save to log"
            onPress={saveDraft}
            loading={saving}
            disabled={reestimating || reestimatingIdx !== null}
            style={{ marginTop: spacing.md }}
          />
          <CancelLink onPress={() => navigation.goBack()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "result" && result) {
    const lowConfidence = result.confidence < 0.6;
    return (
      <Centered>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.infoTitle}>Logged</Text>
        <Text style={styles.bigKcal}>{result.entry.calories} kcal</Text>
        {result.entry.protein > 0 && (
          <Text style={styles.bigProtein}>{result.entry.protein} g protein</Text>
        )}

        {result.items.length > 0 && (
          <View style={styles.breakdown}>
            {result.items.map((it, i) => (
              <View key={i} style={styles.breakdownRow}>
                <Text style={styles.breakdownName} numberOfLines={1}>
                  {it.name}
                  {it.portion ? ` · ${it.portion}` : ""}
                </Text>
                <View style={styles.breakdownValues}>
                  {it.estimatedProtein > 0 && (
                    <Text style={styles.breakdownProtein}>
                      {Math.round(it.estimatedProtein)}g
                    </Text>
                  )}
                  <Text style={styles.breakdownKcal}>
                    {Math.round(it.estimatedCalories)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.infoText}>
          Confidence: {Math.round(result.confidence * 100)}%
          {lowConfidence ? " — double-check this one." : ""}
        </Text>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} />
        <SecondaryButton label="Undo" onPress={undo} />
      </Centered>
    );
  }

  if (phase === "error") {
    return (
      <Centered>
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle" size={30} color={colors.danger} />
          </View>
          <Text style={styles.infoTitle}>Couldn't recognize this item</Text>
          <Text style={styles.infoText}>{errorMsg}</Text>
          <View style={styles.errorBtns}>
            <AppButton
              label="Try again"
              onPress={() => setPhase("capture")}
              style={styles.flexBtn}
            />
            <AppButton
              label="Enter manually"
              variant="outline"
              onPress={() => setPhase("manual")}
              style={styles.flexBtn}
            />
          </View>
        </View>
        <CancelLink onPress={() => navigation.goBack()} />
      </Centered>
    );
  }

  // manual entry
  const recent = Array.from(new Set(entries.map((e) => e.food_name))).slice(0, 6);
  return (
    <SafeAreaView style={styles.manualSafe}>
      <ScrollView
        contentContainerStyle={styles.manualContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.manualTitle}>Enter manually</Text>

        <LabeledField label="Food name">
          <TextInput
            style={styles.input}
            placeholder="e.g. Greek Yogurt, Plain"
            placeholderTextColor={colors.muted}
            value={manualName}
            onChangeText={setManualName}
          />
        </LabeledField>

        <View style={styles.manualRow}>
          <View style={styles.qtyCol}>
            <LabeledField label="Quantity">
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={manualQty}
                onChangeText={setManualQty}
              />
            </LabeledField>
          </View>
          <View style={styles.unitCol}>
            <LabeledField label="Unit">
              <View style={styles.unitPills}>
                {(["g", "oz", "cup"] as Unit[]).map((u) => {
                  const active = manualUnit === u;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setManualUnit(u)}
                      style={[styles.unitPill, active && styles.unitPillActive]}
                    >
                      <Text style={[styles.unitPillText, active && styles.unitPillTextActive]}>
                        {u}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </LabeledField>
          </View>
        </View>

        <LabeledField label="Calories (optional)">
          <TextInput
            style={styles.input}
            placeholder="Leave blank to estimate with AI"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={manualCals}
            onChangeText={setManualCals}
          />
        </LabeledField>

        {recent.length > 0 && (
          <View style={styles.recentWrap}>
            <Text style={styles.recentTitle}>Recent items</Text>
            <View style={styles.chips}>
              {recent.map((name) => (
                <Pressable key={name} style={styles.chip} onPress={() => setManualName(name)}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <AppButton
          label={manualCals.trim() ? "Add entry" : "Estimate & review"}
          onPress={submitManual}
          loading={estimatingManual}
          style={styles.manualSubmit}
        />
        <CancelLink onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- small presentational helpers ----
const Centered = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaView style={styles.centered}>{children}</SafeAreaView>
);

const PrimaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
    onPress={onPress}
  >
    <Text style={styles.primaryBtnText}>{label}</Text>
  </Pressable>
);

const SecondaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
    onPress={onPress}
  >
    <Text style={styles.secondaryBtnText}>{label}</Text>
  </Pressable>
);

const CancelLink = ({ onPress, light }: { onPress: () => void; light?: boolean }) => (
  <Pressable onPress={onPress} style={styles.cancel}>
    <Text style={[styles.cancelText, light && { color: colors.white }]}>Cancel</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  cameraOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: spacing.lg,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scanTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.white },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bracketsWrap: {
    position: "absolute",
    top: "26%",
    bottom: "30%",
    left: 40,
    right: 40,
  },
  bracket: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "rgba(255,255,255,0.7)",
  },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  frameHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  manualLink: { alignSelf: "center", marginTop: spacing.md, padding: spacing.sm },
  manualLinkText: { color: "rgba(255,255,255,0.85)", fontFamily: fonts.heavy, fontSize: 14 },
  // scanning state
  scanningWrap: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  scanningTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.white, marginTop: spacing.md },
  scanningMono: {
    fontFamily: "ui-monospace",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  infoTitle: {
    fontSize: 22,
    fontFamily: fonts.heavy,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  bigKcal: {
    fontSize: 44,
    fontFamily: fonts.black,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  bigProtein: {
    fontSize: 16,
    fontFamily: fonts.heavy,
    color: colors.protein,
    marginTop: spacing.xs,
  },
  successEmoji: { fontSize: 56 },
  errorCard: {
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: "#F6DCDC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  errorBtns: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    width: "100%",
  },
  flexBtn: { flex: 1 },
  manualSafe: { flex: 1, backgroundColor: colors.bg },
  manualContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  manualTitle: {
    fontSize: 24,
    fontFamily: fonts.black,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  manualRow: { flexDirection: "row", gap: spacing.md },
  qtyCol: { flex: 1 },
  unitCol: { flex: 1.4 },
  unitPills: { flexDirection: "row", gap: spacing.sm },
  unitPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  unitPillActive: { borderColor: colors.primary, backgroundColor: colors.tint },
  unitPillText: { fontSize: 14, fontWeight: "700", color: colors.text },
  unitPillTextActive: { color: colors.primaryDark },
  recentWrap: { marginTop: spacing.sm, marginBottom: spacing.lg },
  recentTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: colors.tint,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: "100%",
  },
  chipText: { color: colors.primaryDark, fontSize: 13, fontWeight: "600" },
  manualSubmit: { marginTop: spacing.sm },
  previewHint: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  previewInput: { minHeight: 64, textAlignVertical: "top" },
  previewKcalCard: {
    alignItems: "center",
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  previewKcalValue: {
    fontSize: 40,
    fontFamily: fonts.black,
    color: colors.primary,
  },
  previewKcalUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  previewProteinPill: {
    marginTop: spacing.sm,
    backgroundColor: colors.proteinTint,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  previewProteinText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.protein },
  itemCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemNameInput: { flex: 1, marginBottom: 0 },
  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  itemPortionInput: { flex: 1, marginBottom: 0 },
  itemKcalWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  itemKcalInput: { width: 58, marginBottom: 0, textAlign: "right" },
  itemKcalLabel: { fontSize: 13, fontWeight: "600", color: colors.muted },
  itemProteinInput: { width: 44, marginBottom: 0, textAlign: "right" },
  itemProteinLabel: { fontSize: 13, fontWeight: "700", color: colors.protein },
  itemIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  addItemText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  breakdown: {
    width: "100%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  breakdownName: { flex: 1, color: colors.text, fontSize: 15, marginRight: spacing.md },
  breakdownValues: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  breakdownProtein: { color: colors.protein, fontSize: 14, fontWeight: "800" },
  breakdownKcal: { color: colors.muted, fontSize: 15, fontWeight: "700" },
  input: {
    width: "100%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    width: "100%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  cancel: { marginTop: spacing.lg, alignSelf: "center" },
  cancelText: { color: colors.muted, fontWeight: "600" },
});

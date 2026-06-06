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
import type { FoodEntry, ScanItem } from "../types/models";
import { colors, radius, spacing } from "../theme";
import type { RootStackScreenProps } from "../navigation/types";

type Props = RootStackScreenProps<"Camera">;
type Phase = "capture" | "processing" | "result" | "error" | "manual";
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
      const { entry, error } = await addFoodEntry(res.foodName, res.calories);
      if (error || !entry) {
        setErrorMsg(error ?? "Could not save the entry.");
        setPhase("error");
        return;
      }
      setResult({ entry, confidence: res.confidence, items: res.items });
      setPhase("result");
    } catch (err) {
      setErrorMsg(
        err instanceof WebhookTimeoutError
          ? err.message
          : "Something went wrong while scanning. Please try again."
      );
      setPhase("error");
    }
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
    const cals = parseInt(manualCals, 10);
    if (!manualName.trim() || Number.isNaN(cals) || cals <= 0) {
      Alert.alert("Check your entry", "Enter a food name and a calorie amount.");
      return;
    }
    // Quantity + unit are cosmetic — folded into the stored food name.
    const qty = manualQty.trim();
    const label =
      qty && qty !== "0" ? `${manualName.trim()} (${qty} ${manualUnit})` : manualName.trim();
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

        {/* Top-left close button (standard full-screen camera dismiss) */}
        <SafeAreaView style={styles.topOverlay} edges={["top"]}>
          <Pressable
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
        </SafeAreaView>

        <SafeAreaView style={styles.cameraOverlay} edges={["bottom"]}>
          <View style={styles.cameraControls}>
            <Pressable style={styles.smallBtn} onPress={pickFromGallery}>
              <Text style={styles.smallBtnText}>Gallery</Text>
            </Pressable>
            <Pressable
              style={styles.shutter}
              onPress={takePhoto}
              accessibilityLabel="Take photo"
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable style={styles.smallBtn} onPress={() => setPhase("manual")}>
              <Text style={styles.smallBtnText}>Manual</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === "processing") {
    return (
      <Centered>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.infoTitle}>Scanning your food…</Text>
        <Text style={styles.infoText}>Identifying the item and estimating calories.</Text>
      </Centered>
    );
  }

  if (phase === "result" && result) {
    const lowConfidence = result.confidence < 0.6;
    return (
      <Centered>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.infoTitle}>Logged</Text>
        <Text style={styles.bigKcal}>{result.entry.calories} kcal</Text>

        {result.items.length > 0 && (
          <View style={styles.breakdown}>
            {result.items.map((it, i) => (
              <View key={i} style={styles.breakdownRow}>
                <Text style={styles.breakdownName} numberOfLines={1}>
                  {it.name}
                  {it.portion ? ` · ${it.portion}` : ""}
                </Text>
                <Text style={styles.breakdownKcal}>
                  {Math.round(it.estimatedCalories)}
                </Text>
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

        <LabeledField label="Calories">
          <TextInput
            style={styles.input}
            placeholder="Calories (kcal)"
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

        <AppButton label="Add entry" onPress={submitManual} style={styles.manualSubmit} />
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
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.lg,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  smallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.pill,
  },
  smallBtnText: { color: colors.white, fontWeight: "700" },
  infoTitle: {
    fontSize: 22,
    fontWeight: "800",
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
    fontWeight: "800",
    color: colors.primary,
    marginTop: spacing.sm,
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
    fontWeight: "800",
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

/// <reference types="jest" />
import { parseScanResult } from "./parseScan";

describe("parseScanResult", () => {
  it("parses the real wrapped Gemini webhook shape (food detected)", () => {
    const inner = JSON.stringify({
      items: [
        { name: "Nasi putih", portion: "1 centong", estimatedCalories: 220 },
        { name: "Ayam goreng", portion: "1 potong", estimatedCalories: 240 },
      ],
      totalCalories: 460,
      confidence: "high",
      notes: "",
    });
    const webhookBody = [
      { content: { parts: [{ text: inner }], role: "model" }, finishReason: "STOP", index: 0 },
    ];

    const res = parseScanResult(webhookBody);
    expect(res.calories).toBe(460);
    expect(res.confidence).toBe(0.95);
    expect(res.items).toHaveLength(2);
    expect(res.foodName).toBe("Nasi putih, Ayam goreng");
  });

  it("handles the no-food-detected response (empty items, low confidence)", () => {
    const inner = JSON.stringify({
      items: [],
      totalCalories: 0,
      confidence: "low",
      notes: "No food items were detected.",
    });
    const res = parseScanResult([{ content: { parts: [{ text: inner }] } }]);
    expect(res.items).toHaveLength(0);
    expect(res.calories).toBe(0);
    expect(res.confidence).toBe(0.4);
    expect(res.foodName).toBe("");
    expect(res.notes).toContain("No food");
  });

  it("tolerates markdown-fenced JSON", () => {
    const inner = '```json\n{"items":[{"name":"Tempe","portion":"1","estimatedCalories":100}],"totalCalories":100,"confidence":"medium"}\n```';
    const res = parseScanResult([{ content: { parts: [{ text: inner }] } }]);
    expect(res.calories).toBe(100);
    expect(res.confidence).toBe(0.7);
    expect(res.foodName).toBe("Tempe");
  });

  it("falls back to summing item calories when totalCalories is missing", () => {
    const inner = JSON.stringify({
      items: [
        { name: "A", portion: "1", estimatedCalories: 120 },
        { name: "B", portion: "1", estimatedCalories: 80 },
      ],
      confidence: "medium",
    });
    const res = parseScanResult([{ content: { parts: [{ text: inner }] } }]);
    expect(res.calories).toBe(200);
  });

  it("returns an empty result for garbage / unparseable bodies", () => {
    const res = parseScanResult("not json at all");
    expect(res.items).toHaveLength(0);
    expect(res.calories).toBe(0);
  });

  it("accepts the n8n clean contract (flat object from the Format Response node)", () => {
    // As of the n8n "Format Response" Code node, the webhook returns this
    // unwrapped shape directly instead of Gemini's raw envelope. parseScan
    // stays as a defensive layer that normalizes it.
    const res = parseScanResult({
      items: [{ name: "Jeruk", portion: "1 buah (100-120g)", estimatedCalories: 60 }],
      totalCalories: 60,
      confidence: "high",
      notes: "One small orange.",
    });
    expect(res.calories).toBe(60);
    expect(res.confidence).toBe(0.95);
    expect(res.foodName).toBe("Jeruk");
    expect(res.notes).toBe("One small orange.");
  });

  it("accepts an already-flat object shape", () => {
    const res = parseScanResult({
      items: [{ name: "Soto", portion: "1 mangkok", estimatedCalories: 300 }],
      totalCalories: 300,
      confidence: 0.8,
    });
    expect(res.calories).toBe(300);
    expect(res.confidence).toBe(0.8);
    expect(res.foodName).toBe("Soto");
  });

  it("reads protein from the clean contract (totalProtein + per-item)", () => {
    const res = parseScanResult({
      items: [
        { name: "Nasi putih", portion: "1 centong", estimatedCalories: 234, estimatedProtein: 3.6 },
        { name: "Ayam goreng", portion: "1 potong", estimatedCalories: 220, estimatedProtein: 20 },
      ],
      totalCalories: 454,
      totalProtein: 23.6,
      confidence: "medium",
    });
    expect(res.protein).toBe(24); // rounded from 23.6
    expect(res.items[0].estimatedProtein).toBe(3.6);
    expect(res.items[1].estimatedProtein).toBe(20);
  });

  it("sums item protein when totalProtein is missing", () => {
    const res = parseScanResult({
      items: [
        { name: "A", portion: "1", estimatedCalories: 120, estimatedProtein: 5 },
        { name: "B", portion: "1", estimatedCalories: 80, estimatedProtein: 7 },
      ],
      confidence: "medium",
    });
    expect(res.protein).toBe(12);
  });

  it("defaults protein to 0 for the old contract without protein fields", () => {
    const inner = JSON.stringify({
      items: [{ name: "Tempe", portion: "1", estimatedCalories: 100 }],
      totalCalories: 100,
      confidence: "high",
    });
    const res = parseScanResult([{ content: { parts: [{ text: inner }] } }]);
    expect(res.protein).toBe(0);
    expect(res.items[0].estimatedProtein).toBe(0);
  });
});

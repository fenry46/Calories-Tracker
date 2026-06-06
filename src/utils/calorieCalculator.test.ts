/// <reference types="jest" />
import {
  calcBMR,
  calcTDEE,
  calcTarget,
  calcDailyCalorieTarget,
  lbsToKg,
  inToCm,
  MIN_SAFE_CALORIES,
} from "./calorieCalculator";

describe("calorieCalculator", () => {
  describe("calcBMR (Mifflin-St Jeor)", () => {
    it("computes male BMR", () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(
        calcBMR({ biologicalSex: "MALE", age: 30, weightKg: 80, heightCm: 180 })
      ).toBe(1780);
    });

    it("computes female BMR", () => {
      // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(
        calcBMR({ biologicalSex: "FEMALE", age: 25, weightKg: 60, heightCm: 165 })
      ).toBeCloseTo(1345.25, 2);
    });
  });

  describe("calcTDEE", () => {
    it("applies the sedentary 1.2 factor", () => {
      expect(calcTDEE(1780)).toBeCloseTo(2136, 5);
    });
  });

  describe("calcTarget", () => {
    it("LOSE subtracts 500", () => {
      expect(calcTarget(2136, "LOSE")).toBe(1636);
    });

    it("MAINTAIN keeps TDEE", () => {
      expect(calcTarget(2136, "MAINTAIN")).toBe(2136);
    });

    it("GAIN adds 400", () => {
      expect(calcTarget(2136, "GAIN")).toBe(2536);
    });

    it("LOSE is floored at the safe minimum", () => {
      // tiny TDEE - 500 would drop below 1200
      expect(calcTarget(1400, "LOSE")).toBe(MIN_SAFE_CALORIES);
    });

    it("rounds to an integer", () => {
      expect(Number.isInteger(calcTarget(1345.25 * 1.2, "MAINTAIN"))).toBe(true);
    });
  });

  describe("calcDailyCalorieTarget (end to end)", () => {
    it("matches the worked example: male 80kg/180cm/30y LOSE -> 1636", () => {
      expect(
        calcDailyCalorieTarget(
          { biologicalSex: "MALE", age: 30, weightKg: 80, heightCm: 180 },
          "LOSE"
        )
      ).toBe(1636);
    });
  });

  describe("unit conversions", () => {
    it("converts lbs to kg", () => {
      expect(lbsToKg(176.37)).toBeCloseTo(80, 1);
    });
    it("converts inches to cm", () => {
      expect(inToCm(70.866)).toBeCloseTo(180, 1);
    });
  });
});

/**
 * NutriPen design system — warm & friendly, violet accent.
 * Ported from the Claude Design "NutriPen" prototype (cream surfaces,
 * #6d4ad9 violet, Nunito typography).
 */
export const colors = {
  bg: "#FBF8F5", // warm cream app background
  card: "#FFFFFF",
  border: "#ECE5DD",
  text: "#2C2722", // espresso
  muted: "#8A8178",
  faint: "#B8AFA4", // tertiary / captions / disabled ticks
  primary: "#6D4AD9", // violet — brand accent
  primaryDark: "#5A3BC0", // pressed / emphasis
  accent: "#B79BFF", // light violet — on-dark accents
  tint: "#EFEAFC", // violet tint — selected / soft surfaces
  primaryTint: "#EFEAFC",
  primaryTintSoft: "#F7F4FE",
  success: "#34A06F", // on-track green
  successTint: "#E9F6EF",
  protein: "#D4537A", // pink — protein accent (from NutriPen prototype)
  proteinTint: "#FDEEF0", // soft pink surface for protein chips

  danger: "#E0683A", // target exceeded (warm orange-red)
  dangerTint: "#FBEADF",
  white: "#FFFFFF",
  track: "#EFE7DB", // ring / progress track
  stepBg: "#F1ECE6", // stepper & soft pill buttons
  dark: "#14110F", // camera overlay / scanner
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

/**
 * Font families. Nunito (rounded, friendly) for headings, numbers and button
 * labels; Nunito Sans for body copy. Loaded in App.tsx via @expo-google-fonts.
 */
export const fonts = {
  black: "Nunito_900Black",
  heavy: "Nunito_800ExtraBold",
  bold: "Nunito_700Bold",
  semibold: "Nunito_600SemiBold",
  body: "NunitoSans_400Regular",
  bodySemibold: "NunitoSans_600SemiBold",
  bodyBold: "NunitoSans_700Bold",
} as const;

/** Soft elevated-card shadow used across surfaces. */
export const shadow = {
  card: {
    shadowColor: "#2C1C0C",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  button: {
    shadowColor: "#6D4AD9",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

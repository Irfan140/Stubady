/**
 * Lamp-pool world tokens.
 *
 * One pool of lamplight on a dark desk: deep ink grounds, warm lit
 * surfaces, a single amber accent that owns primary actions and active
 * marks only. Status reads as hairline bands, never filled pills; text
 * stays achromatic. Elevation is border OR shadow, never both.
 */
const lightPalette = {
  bg: "#F7F3EA",
  surface: "#FFFDF8",
  pool: "#F1E9D6",
  ink: "#1C1712",
  body: "#4C463A",
  muted: "#6F6759",
  faint: "#776E5F",
  line: "#E3D9C2",
  primary: "#9A5B0B",
  primaryDeep: "#7C4708",
  primarySoft: "#F3E2C2",
  primaryInk: "#FFFFFF",
  accent: "#8A5A24",
  success: "#0E7A55",
  successSoft: "#DDEEE3",
  warning: "#96600A",
  warningSoft: "#F5E7C8",
  danger: "#BC3240",
  dangerSoft: "#F9E3E4",
  dangerBorder: "#EFBFC3",
  inputBg: "#FFFFFF",
  onPrimary: "#FFFFFF",
} as const;

export const darkPalette = {
  bg: "#0A0E18",
  surface: "#141A2E",
  pool: "#1C2338",
  ink: "#F5F1E6",
  body: "#C9C3B4",
  muted: "#9BA1B5",
  faint: "#7E87A1",
  line: "#262D47",
  primary: "#F2B45C",
  primaryDeep: "#D9963C",
  primarySoft: "#2C2311",
  primaryInk: "#221503",
  accent: "#C77B3F",
  success: "#43C08B",
  successSoft: "#0E2A20",
  warning: "#E5A13C",
  warningSoft: "#2E220D",
  danger: "#F0717E",
  dangerSoft: "#331418",
  dangerBorder: "#5A232A",
  inputBg: "#101627",
  onPrimary: "#221503",
} as const;

export type Palette = { [K in keyof typeof lightPalette]: string };

export type ColorSchemeName = "light" | "dark";

export const getPalette = (scheme: ColorSchemeName): Palette =>
  scheme === "dark" ? darkPalette : lightPalette;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 19 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
} as const;

/** Single elevation: offset + soft blur, neutral ink. No colored halos. */
export const shadow = {
  raised: {
    boxShadow: "0 10px 28px rgba(5, 8, 18, 0.35)",
  },
} as const;

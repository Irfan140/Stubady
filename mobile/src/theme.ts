export const palette = {
  bg: "#F4F6FB",
  surface: "#FFFFFF",
  ink: "#0B1220",
  body: "#3F4756",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E6EAF2",
  primary: "#4F46E5",
  primaryDeep: "#4338CA",
  primarySoft: "#EEF0FE",
  accent: "#8B5CF6",
  success: "#059669",
  successSoft: "#E7F7F0",
  warning: "#D97706",
  warningSoft: "#FDF3E3",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  h2: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 19 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
} as const;

export const shadow = {
  card: {
    boxShadow: "0 2px 10px rgba(11, 18, 32, 0.05)",
  },
  raised: {
    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.22)",
  },
} as const;

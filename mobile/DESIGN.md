# Design — mobile app (lamp-pool world)

<!-- impeccable:design-schema 1 -->

Visual system for the Stubady Expo app, built from the locked direction
contract (seed key 9bcf030d). One pool of lamplight on a dark desk:
deep ink grounds, warm lit surfaces, a single amber accent. Operate
mode — the tool disappears into the revision task.

## Color

Semantic roles in `mobile/src/theme.ts` (`lightPalette` / `darkPalette`,
resolved by `stores/theme-store.ts`). Dark is the lead scene (late
revision under lamplight); light is a full paper scheme, never an
invert.

- Grounds: `bg` (ink / paper), `surface` (lit panel), `pool`
  (recessed layer: empty-state medallions, steppers, sheet close).
- Ink: `ink` body text, `body`, `muted`, `faint` (secondary only).
- Accent: `primary` amber owns primary actions + active marks only;
  `primaryDeep` for active text on tint; `primarySoft` tint grounds;
  `primaryInk` is the text on a primary fill. `accent` copper reserved.
- State: `success` / `warning` / `danger` + `*Soft` grounds and
  `dangerBorder`. Status reads as hairline bands (ProgressLine track
  fill), dots paired with text labels, or tinted chips — never filled
  status pills, never color alone.
- Inputs: `inputBg`.

## Type

System sans on both OSes (SF / Roboto). Fixed scale, tight ratio:
display 30, title 24, h2 19, h3 16, body 15/22, caption 13/19.
Tracking never below -0.02em. Headings carry their own weight — no
kickers or eyebrows anywhere. Emoji never stands in for icons;
`expo-symbols` throughout, one stroke per platform.

## Shape and elevation

Radii: 8 / 12 / 14 / 16; pill reserved for small controls (chips,
steppers, dots). Cards are 14 with a 1px `line` border and no shadow.
Elevation is border OR shadow: only raised primaries (amber buttons,
send button, sheets) carry the single neutral elevation
(`0 10px 28px rgba(5,8,18,.35)`). No nested cards, no ghost cards.

## Components (`components/ui.tsx`)

`Screen`, `LoadingState`, `ErrorState`, `EmptyState` (teaching copy +
action), `Button` (primary amber / ghost hairline / danger),
`Card`, `Chip`, `TextField`, `Avatar`, `TopBar` (one header system on
every pushed screen; Stack gestures stay alive underneath),
`Segmented` (active option drawn heavier), `ProgressLine`,
`Sheet` (backdrop darkens the room; one home for intake, rename,
menus). Touch targets ≥44pt; every interactive element named for
screen readers.

## Motion

One authored moment: the sheet rising while the room darkens.
Everything else is state feedback (streaming cursor, pressed scales,
spinners). No entrance choreography, no decoration.

## Proof pairing

Every generated claim sits beside its source: chat replies carry
citation chips from the send result, the chat header names the ready
source count, hub actions gate on readiness with the reason stated.

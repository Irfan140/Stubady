---
name: Stubady Web
description: Marketing, privacy, and account-deletion site for the Stubady study app.
colors:
  brand: "#2563eb"
  brand-deep: "#1d4ed8"
  brand-tint: "#dbeafe"
  ink: "#0f172a"
  ink-soft: "#1e293b"
  muted: "#64748b"
  faint: "#94a3b8"
  paper: "#f8fafc"
  cream: "#f1f5f9"
  card: "#ffffff"
  line: "#e2e8f0"
  line-soft: "#f1f5f9"
  moss: "#059669"
  moss-tint: "#ecfdf5"
  night: "#0f172a"
  accent-cyan: "#06b6d4"
  accent-violet: "#8b5cf6"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.35rem, 5.2vw, 3.65rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  md: "6px"
  xl: "12px"
  2xl: "16px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "14px 24px"
  chip:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "18px"
  link-editorial:
    textColor: "{colors.brand}"
---

# Design System: Stubady Web

## Overview

**Creative North Star: "The Annotated Desk"**

This is the public desk for a study product: paper grounds, ink text,
ruled lines, and citations attached to every claim — the marketing site
reads the way the product works. One confident blue carries actions and
active states; one green marks trust (ready states, verified points).
Nothing shouts. Sections alternate paper and white with hairline
dividers, and each claim is paired with a concrete interface detail
that proves it.

The system serves three hash routes (home, privacy, delete-account)
with one header, one footer, and shared section patterns. It is
light-only, single-column-centered, and restrained throughout.

**Key Characteristics:**
- Paper ground, ink text, hairline borders before shadows.
- A single blue for action; a single green for trust.
- Citation chips and interface mock panels as proof, not decoration.
- Plainspoken labels; uppercase micro-labels only as section eyebrows.

## Colors

One blue for action and one green for trust on a slate-paper neutral
ground. Violet appears only inside the hero gradient headline.

### Primary
- **Brand blue** (#2563eb): primary actions, active nav state, links,
  focus rings, status dots for in-progress work. Hover deepens to
  brand-deep (#1d4ed8). Pale tint (#dbeafe) grounds chips, eyebrows,
  and question bubbles.

### Secondary
- **Moss green** (#059669): ready states, verified checkmarks,
  success-adjacent trust marks on pale mint (#ecfdf5).

### Tertiary
- **Cyan** (#06b6d4) and **violet** (#8b5cf6): gradient-headline duty
  only (`135deg, brand 0%, cyan 55%, violet 100%`). Never used as
  standalone text, borders, or fills.

### Neutral
- **Ink** (#0f172a): headlines, dark pill buttons, footer legal line.
- **Ink soft** (#1e293b): body-adjacent emphasis, button hover.
- **Muted slate** (#64748b): body copy on paper, secondary text.
- **Faint slate** (#94a3b8): captions, timestamps, micro-labels.
- **Paper** (#f8fafc): page ground. **Card white** (#ffffff): raised
  surfaces. **Cream** (#f1f5f9): tinted section grounds and soft lines.
- **Line** (#e2e8f0): borders and dividers. **Line soft** (#f1f5f9):
  inner dividers. **Night** (#0f172a): architecture diagram ground and
  fullscreen modal scrims.

### Named Rules
**The One Blue Rule.** Blue means clickable or active. It never
decorates body copy, dividers, or backgrounds beyond its pale tint.
**The Flat-By-Default Rule.** Borders separate; shadows float only
panels that leave the page (hero figure, modals, sticky header).

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui fallback)
**Body Font:** Inter (same stack)
**Label/Mono Font:** none distinct; labels are Inter semibold uppercase.

**Character:** One workhorse sans at two weights. Headlines are tight
and heavy; body is roomy and quiet. No display serif, no mono costume.

### Hierarchy
- **Display** (800, clamp(2.35rem, 5.2vw, 3.65rem), 0.95): home hero
  headline only, with the gradient span on the second line.
- **Headline** (800, 30px, 1.1): section titles (36px on sm+).
- **Title** (700–800, 17–22px, 1.3): card titles, step titles,
  FAQ-adjacent headings.
- **Body** (400–500, 15–17px, 1.75–1.85): prose and ledes; reading
  measure stays near 65ch via max-w prose containers.
- **Label** (700–800, 11–12px, 0.12–0.14em, uppercase): section
  eyebrows, table headers, status pills.

### Named Rules
**The Eyebrow Rule.** One uppercase micro-label may open a section; it
never appears inside cards or beside buttons.

## Layout

Single centered column (`max-w-6xl`, 20px gutters, 32px on sm+).
Sections run 80px vertical padding (96–112px on lg), separated by
hairline top borders with alternating paper, white, and cream grounds.
Home composes: hero grid (copy + figure, two columns on lg),
pipeline strip, problem list (sticky heading + rows), tool rows
(alternating two-column), three-step grid, architecture band, trust
band, data cards, FAQ grid. Privacy and delete-account use a narrow
reading column with a sticky section index on lg. Header is sticky
(h-16) with blur; footer is four columns collapsing to one.

## Elevation & Depth

Flat by default. Borders (`line`, `line-soft`) separate everything at
rest. Shadows appear only where a surface leaves the page.

### Shadow Vocabulary (if applicable)
- **Card lift** (`box-shadow: 0 1px 3px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.04)`): white cards and panels.
- **Hero figure** (`box-shadow: 0 24px 60px -28px rgba(22,33,58,0.35)`): the home architecture/product figure only.
- **Sticky header** (`box-shadow: 0 1px 12px rgba(15,23,42,0.06)`): applied past 8px scroll.

## Shapes

Pills for actions and status (buttons, nav links, chips, tabs).
12px radius for cards, buttons, and inputs; 16px for large panels,
modals, and the FAQ box. Borders are 1px hairlines; logo badge is a
12px rounded square. No clipping tricks, no decorative masks.

## Components

### Buttons
- **Shape:** pill (999px), semibold.
- **Primary:** ink fill, white text, small shadow; padding 10px 16px
  (header) to 12px 24px (hero store badge). Hover softens to ink-soft.
- **Hover / Focus:** color transitions (0.18s); visible 2px brand
  focus ring with 3px offset on all interactive elements.
- **Secondary:** white fill, 1px line border, ink text, 12px radius.

### Chips
- **Style:** pale tint fill (brand or moss), 11–12px semibold tinted
  text, pill radius, dot prefix for live status.
- **State:** static proof labels; the processing chip pulses its dot.

### Cards / Containers
- **Corner Style:** 12px radius (16px for feature panels).
- **Background:** white on paper; paper on white sections.
- **Shadow Strategy:** card lift at rest per Elevation section.
- **Border:** 1px line (soft inner dividers).
- **Internal Padding:** 16–24px scale.

### Inputs / Fields
No form inputs exist on this site (delete-account routes through
email instructions). If a field is ever added: 12px radius, 1px line
border, white fill, brand border on focus — matching button-secondary.

### Navigation
- Sticky blurred header; desktop pill links (14px medium, slate pill
  hover); active route in brand blue; mobile hamburger opens a
  full-width stacked menu with dividers. Skip-to-content link first
  in tab order. Footer: four-column link map with uppercase micro
  headers, collapsing to one column.

### Product Figure
The home hero figure is a faithful interface mock (window bar,
sources rail with readiness pills, cited answer, summary/deck tiles),
captioned as an illustrative preview. Grounded-answer citation chips
(bordered, paper fill, 11px muted text) are the signature detail.

### FAQ Disclosure
Native details/summary rows in a bordered 16px box; plus-icon rotates
45 degrees open. No custom accordion scripting.

## Do's and Don'ts

### Do:
- **Do** pair every marketing claim with an interface detail that
  proves it (citation chip, readiness pill, mock panel).
- **Do** keep blue clickable-or-active and green ready-or-verified.
- **Do** honor reduced motion (reveals resolve visible, caret stops).
- **Do** keep one section eyebrow maximum per section.

### Don't:
- **Don't** use cyan or violet outside the hero gradient headline.
- **Don't** add shadows to resting content; borders separate.
- **Don't** invent testimonials, metrics, pricing, or store ratings —
  none exist (see PRODUCT.md evidence).
- **Don't** add form inputs styled outside the secondary-button
  language.

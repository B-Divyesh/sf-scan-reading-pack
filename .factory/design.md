# Scan Reading Pack — visual thesis

## Direction

**Night-market neon signage, translated into a quiet reading workshop.** A scanned page is a dim stall: imperfect, tactile, and worth inspecting. Cyan guide marks act like a restorer's light table; acid-lime labels mark verified output; hot coral is reserved for uncertainty. The interface should feel precise after dark—not like a nightclub, a generic dashboard, or an AI chat wrapper.

The page image and its extracted text are always treated as a pair. A vertical “trace wire” joins source-page references to corrected lines, making verification the identity of the product rather than a secondary feature.

## Palette

This is an intentionally single-mode, dark product: scan review benefits from a stable dark surround around pale paper previews.

- `ink-950 #090B12` — app background, like a night street after rain
- `ink-900 #10141F` — work surfaces
- `ink-800 #191F2E` — raised controls
- `paper #F6F1E3` — primary text and scanned-paper previews
- `smoke #B8BECA` — secondary text (7.8:1 on ink-950)
- `cyan #50E7F2` — primary action and source-page trace (12.2:1 on ink-950)
- `cyan-ink #062D33` — text on cyan
- `lime #C7F36B` — verified/success signal (14.5:1 on ink-950)
- `coral #FF806F` — low-confidence/warning signal (8.1:1 on ink-950)
- `danger #FF9A9A` — destructive/error copy

Color is never the only signal: every state also has a label, icon, or text description.

## Typography

- Display and interface: **Azeret Mono**, self-hosted WOFF2, 500/700. Its measured, typeset texture echoes page coordinates and OCR output.
- Reading copy: **Atkinson Hyperlegible**, self-hosted WOFF2, 400/700. Its distinct letterforms support proofreading and long-form reading.
- Type scale: 14 / 16 / 20 / 25 / 32 / clamp(40–64) px. Reading text uses 1.65 line height and a 68-character measure. Numeric coordinates use tabular figures.

## Spacing and shape

- 4px base; primary rhythm 8 / 12 / 16 / 24 / 32 / 48 / 72px.
- Work areas group by proximity; independent documents use bordered slabs only where they really behave as objects.
- Corners are clipped or modest (4–12px), evoking enamel signs rather than rounded SaaS cards.
- All targets are at least 44×44px. Focus uses a 3px cyan outer ring and 2px ink separation.

## Interaction grammar

- **Trace:** selecting a text block lights its page coordinate and scrolls the source crop into view.
- **Punch ticket:** confidence items use numbered coral tickets; correction changes the ticket to a lime “checked” stamp.
- **Workbench:** the main flow is Import → Recognize → Review → Export, shown as a compact status rail rather than wizard screens.
- Copy is factual: “Recognize pages locally,” never “perfect” or “AI-powered.”

## Motion policy

- 180ms control state changes; 260ms work-surface reveal with transform and opacity.
- Recognition progress advances linearly; no indefinite ornamental loops.
- Page-to-text trace pulses once when followed.
- Under `prefers-reduced-motion: reduce`, all transforms and smooth scrolling become instant and progress is communicated numerically.

## Original asset plan and provenance

Hero illustration: an editorial still life of a weathered scanned book becoming a tidy stack of coordinate-tagged reading slips on a cyan-lit night-market workbench. It explains source-to-pack transformation without pretending to show the live UI.

Prompt sheet: “Editorial still life, overhead three-quarter view of a worn unbranded scanned book on a dark indigo night-market typesetter's workbench, pale paper pages, cyan inspection light, tiny lime registration marks and coral correction tabs, a neat stack of abstract reading slips connected to the source by thin luminous guide threads, enamel sign materials, subtle rain-slick reflections, rich charcoal negative space on the left, tactile paper grain, cinematic soft light, sophisticated product illustration, no people, no readable text, no letters, no numbers, no logos, no watermark, no brands, no UI screenshot, no gradients.”

- Generator: Azure OpenAI image generation via the factory `gen-image.sh` helper (`factory-image`).
- License/provenance: generated specifically for Scan Reading Pack on 2026-08-28; original product artwork.
- Store full source and prompt sidecar in `assets/src/`; ship optimized WebP/AVIF derivatives only.
- Interface icons are original inline SVG marks built from simple geometric paths.


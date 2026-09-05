# Phase 2C design system

Status: local implementation foundation, uncommitted review checkpoint.

## Direction and tokens

“Dubai Property Intelligence” combines editorial space with useful evidence. The
implemented palette is paper `#fff`, cool mineral paper `#f6f8f7`, ink `#0c1411`,
green `#2e5a4b`, restrained gold `#c2a45c`, and readable slate `#6b6b6b`.
Instrument Sans is the working face; EB Garamond is reserved for rare accent lines.

- Type: fluid display 1/2/3, lead, body, caption and uppercase eyebrow.
- Space: 24px gutter; 64px, 104px and 144px section scales.
- Widths: 34rem reading measure, 46rem narrow, 76rem wide, 90rem shell.
- Grid: 12 columns on desktop; single column by default; 44px minimum targets.
- Rules: square geometry, cool hairlines, green two-pixel keyboard focus.
- Imagery: 16:9 landscape, 4:5 card, 3:4 portrait; captions state provenance.
- State: positive `#236347`, warning `#8a5a12`, neutral `#52605a`.
- Charts: green, muted green, gold and slate; direct labels precede legends.
- Motion: 400/600/1100ms editorial easing; removed under reduced-motion.

Commercial, editorial and official content use explicit labels. Official DLD records
use compact paper intros and source notices; commercial projects use image-led pages;
editorial pages foreground author, reviewed date and sources.

## Component architecture

`Header` owns the grouped desktop menu and independent mobile information
architecture. `DiscoveryPanel` is the homepage action gateway. `DirectoryIntro` and
`DirectoryTrust` distinguish public records from sales content. `ContextualConversion`
preserves intent and source attribution. `MobileContactBar` exposes contact and AI
without inventing a phone/WhatsApp action.

Future voice entry is intentionally absent. Fish Audio remains a documented future
integration and may not be represented as available until its privacy, consent,
transcript and lead-routing behavior is designed.

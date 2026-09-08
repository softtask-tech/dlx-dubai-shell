# Section vocabulary

Why the site read as a template, and the rules that stop it drifting back.

## The diagnosis

It was never the palette or the type. It was that **twenty-five sections opened
with the same four moves** — eyebrow, headline, gold hairline, grey paragraph —
and, more damagingly, **every section carried the same weight**. The homepage
ran five consecutive sections announcing themselves identically. A page with no
light passages has no loud ones either: when everything is emphasised, nothing
is, and the eye reads the repetition rather than the content.

Consistency of *components* is good and worth keeping. Consistency of *opening
move* is what makes a page feel assembled from a kit.

## The shapes, and when each earns its place

**Stated** — `SectionOpener`. Eyebrow, headline, rule, lead. The default, for a
section that introduces a body of content the reader has not met yet. It is
still the right answer often; it is not the right answer five times running.

**Beat** — `StatementBand`. One sentence, set large, with nothing under it to
explain itself and no call to action. Not a section of content: the pause
between two of them. It works because it withholds everything a section
normally offers.

- One sentence. If it needs two, it is a section.
- No eyebrow. A beat that labels itself is a section again.
- The footnote is *evidence*, not elaboration — something checkable, so the
  sentence is a claim rather than a slogan. Better absent than padded.
- Never twice in a row, never adjacent to another statement.

**Figure-led** — the section opens on its own data, with no headline above it.
`ReportMasthead`, `YieldPriceMap`. Correct wherever a reader arrived from a
search for the number: making them scroll past a photograph and a paragraph to
reach it is a tax on the person who wanted the page most.

**Quiet** — an eyebrow-sized heading, then the content. Right when the content
is already made of headings, so a heading above them is a heading about
headings. The homepage FAQ opens this way: every question is its own title, and
"The questions we get first" told the reader nothing the questions did not.

**Quiet does not mean headless.** The first version of this dropped the `<h2>`
along with the display type, which made three sections light to the eye and
invisible to anyone navigating by heading — a worse fault than the repetition it
was fixing. Set the eyebrow *as* the heading (`<h2 className="eyebrow">`) rather
than putting an `Eyebrow` span where a heading used to be. Every section keeps
its place in the outline; only its weight changes.

**Cinematic** — full-bleed photograph with type over it. At most twice per page,
and it must be the subject, not decoration.

## Rules

**Never two of the same shape adjacently.** Nor the same `data-surface` twice in
a row — check the sequence when you add a section.

**Structural devices must encode something true.** This is the rule the site was
breaking most often and least visibly. Numbering (01 / 02 / 03) asserts an
order. It belongs on ranked results, guide contents and chapters, where the
position is information. It was also on:

| Where | What was numbered | Is it a sequence? |
| --- | --- | --- |
| About | Four commitments | No — independent |
| Services detail | Deliverables | No — a set of what you get |
| Project detail | Investment considerations | No, and laid across two columns, so 01/02 did not even say which way to read |
| Localised services index | Nine services | No |

All four now use a gold rule, which says "another one of these" without
claiming a position. Two were also `<ol>` elements, so a screen reader
announced an ordinal that meant nothing.

The general form: **a counter is information when the order carries meaning and
decoration when it does not, and decoration that asserts something false is
worse than no decoration.** The same test applies to eyebrows, dividers and
badges.

**Prose is not a layout.** "Heading left, grey paragraph right" appeared in 82
twelve-column grids. Where the content is facts, set it as facts — a ledger, a
strip, a table, a chart. Reach for a paragraph when the content is genuinely an
argument.

**Vary weight, not just background.** Alternating light/cream/dark while every
section stays the same size does not create rhythm. Density is the variable that
matters: a heavy section, a beat, a heavy section.

## Checking a page

1. List the sections and their opening shape. Two the same in a row is a defect.
2. List the surfaces. Two the same in a row is a defect.
3. Find every counter, eyebrow and divider and ask what it asserts. If the
   assertion is not true, remove it.
4. Find every grey paragraph. If it is stating facts, it wants a different form.
5. Read only the headlines. If they describe the content rather than being it,
   the section probably wants a quiet or figure-led opening instead.

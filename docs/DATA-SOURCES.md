# Where the non-DLD content came from

The site makes two kinds of factual claim and they are held to different standards.

**Market figures** (prices, yields, transaction counts) come from the Dubai Land
Department pipeline and nowhere else. They arrive in `dld_transactions` and
`area_stats` carrying their provenance, and `src/data/market.ts` turns that
provenance into the line the page prints: "Source: Dubai Land Department" when
the rows really are DLD records, and an explicit statement that the figures are
illustrative when they are not. No number of that kind is ever typed into a
seed file or a component. That rule is what makes the citation worth anything.

**Descriptive content** about developers and communities is editorial, written
by us, and seeded from `supabase/seed/developers-and-communities-seed.sql`.
It is not DLD data and is not presented as such. This document records where
each claim in that seed came from, so a reader can check it and so a future
editor knows which statements are sourced and which are our own judgement.

DLX is not affiliated with the Dubai Land Department. Citing the DLD as a data
source is not a claim of endorsement, and nothing on the site should imply one.

## What is sourced and what is judgement

Each entry below separates the two:

- **Sourced.** A fact with a public source: a founding year, a master
  developer, a district count, a DLD sector name.
- **Ours.** The "what this means for a buyer" sentence attached to it. That is
  a brokerage's opinion, written in our voice, and it is why the summaries read
  the way they do rather than like an encyclopedia entry. It is not sourced
  because it is not that kind of claim.

## Developers

| Developer | Sourced facts | Source |
| --- | --- | --- |
| Emaar Properties | Founded 1997; listed on the Dubai Financial Market; Burj Khalifa and The Dubai Mall; master communities Downtown Dubai, Dubai Marina, Emirates Living, Arabian Ranches | [Wikipedia: Emaar Developments](https://en.wikipedia.org/wiki/Emaar_Developments) |
| DAMAC Properties | Founded 2002; privately held; branded residences; DAMAC Hills, DAMAC Lagoons, DAMAC Islands | [Wikipedia: DAMAC Properties](https://en.wikipedia.org/wiki/DAMAC_Properties) |
| Nakheel | Founded 2003; Palm Jumeirah, Palm Jebel Ali, The World, International City, Jumeirah Lake Towers, Jumeirah Village Circle | [Wikipedia: Nakheel Properties](https://en.wikipedia.org/wiki/Nakheel_Properties) |
| Sobha Realty | Group established 1976; Dubai headquartered; Sobha Hartland | [Wikipedia: Sobha LLC](https://en.wikipedia.org/wiki/Sobha_LLC) |
| Meraas | Founded 2007; Dubai headquartered; City Walk, Bluewaters, La Mer | [Wikipedia: Meraas](https://en.wikipedia.org/wiki/Meraas) |
| Ellington Properties | Founded 2014; design-led; Jumeirah Village Circle, Downtown, Palm Jumeirah | [Property Finder developer list](https://www.propertyfinder.ae/en/new-projects/dev-list/dubai) |
| Binghatti | Founded 2008 by Hussain Binghatti | [Wikipedia: Binghatti Properties](https://en.wikipedia.org/wiki/Binghatti_Properties) |
| Azizi Developments | Founded 2013 | [Property Finder developer list](https://www.propertyfinder.ae/en/new-projects/dev-list/dubai) |
| Danube Properties | Danube Group founded 1993 by Rizwan Sajan; Danube Properties founded 2014; the one percent monthly payment plan | [Danube Properties leadership](https://danubeproperties.com/about-us/leadership-team/rizwan-sajan/), [Danube Group history](https://danubeholding.com/our-story/) |
| Select Group | Active in Dubai since 2002; waterfront towers in Dubai Marina | [Property Finder developer list](https://www.propertyfinder.ae/en/new-projects/dev-list/dubai) |

One correction worth recording, because it appears in circulation: Palm
Jumeirah, Palm Jebel Ali and Deira Islands are Nakheel projects, not Meraas
ones. Some secondary sources attribute them to Meraas. The seed follows
Nakheel's own project list.

## Communities

| Community | Sourced facts | Source |
| --- | --- | --- |
| Downtown Dubai | Emaar master community; Burj Khalifa and The Dubai Mall | [Wikipedia: Emaar Developments](https://en.wikipedia.org/wiki/Emaar_Developments) |
| Business Bay | Master-planned by Dubai Properties (Dubai Holding); roughly 64 million square feet of freehold; mixed commercial and residential on the Dubai Canal | [Propsearch: Business Bay](https://propsearch.ae/dubai/business-bay) |
| Dubai Marina | Emaar master community; artificial marina | [Wikipedia: Emaar Developments](https://en.wikipedia.org/wiki/Emaar_Developments) |
| Palm Jumeirah | Nakheel; reclaimed island; villas on the fronds, apartments on the trunk | [Wikipedia: Nakheel Properties](https://en.wikipedia.org/wiki/Nakheel_Properties) |
| Dubai Hills Estate | Emaar and Meraas joint venture; about 2,700 acres; 18-hole championship golf course; long-term programme of roughly 22,000 apartments and 4,600 villas | [Provident Estate area guide](https://providentestate.com/area-guides/dubai-hills-estate/), [Propsearch: Dubai Hills Estate](https://propsearch.ae/dubai/dubai-hills-estate) |
| Jumeirah Village Circle | Nakheel master developer; bounded by Al Khail Road, Sheikh Mohammed Bin Zayed Road and Hessa Street; full completion not expected until around 2030 | [JVC area guide](https://off-planproperties.ae/jumeirah-village-circle-jvc/) |
| Dubai Creek Harbour | Emaar and Dubai Holding; nine districts; larger land area than Downtown; on Ras Al Khor | [Gulf News: Dubai Creek Harbour](https://gulfnews.com/amp/story/general%2Fdubai-creek-harbour-the-next-big-city-within-a-city-1.1210297), [Dubai Creek Harbour overview](https://buyoffplanproperty.com/dubai-creek-harbour/) |
| Arabian Ranches | Emaar villa community off Sheikh Mohammed Bin Zayed Road; Ranches 1 and Ranches 2 are separate DLD sectors | [Wikipedia: Arabian Ranches](https://en.wikipedia.org/wiki/Arabian_Ranches), [Bayut area guide](https://www.bayut.com/area-guides/arabian-ranches/) |
| DAMAC Hills | DAMAC master community around the Trump International golf course | [Wikipedia: DAMAC Properties](https://en.wikipedia.org/wiki/DAMAC_Properties) |
| Mohammed Bin Rashid City | Large master development between Downtown and Meydan; contains District One and Sobha Hartland; crystal lagoon | [MBR City area guide](https://opr.ae/areas/mohammed-bin-rashid-al-maktoum-city) |

## The DLD sector names

`areas.dld_area_name` is the join key `link_transactions_to_areas()` uses to
attach a transaction to a community. It has to be the DLD's own sector name,
not the marketing name, and the two frequently differ: Downtown Dubai transacts
as **Burj Khalifa**, Dubai Marina as **Marsa Dubai**, Dubai Hills Estate as
**Hadaeq Sheikh Mohammed Bin Rashid**.

| Community | DLD sector name |
| --- | --- |
| Downtown Dubai | Burj Khalifa |
| Business Bay | Business Bay |
| Dubai Marina | Marsa Dubai |
| Palm Jumeirah | Palm Jumeirah |
| Dubai Hills Estate | Hadaeq Sheikh Mohammed Bin Rashid |
| Jumeirah Village Circle | Al Barsha South Fourth |
| Dubai Creek Harbour | Al Khairan First |
| Arabian Ranches | Wadi Al Safa 6 |
| DAMAC Hills | Al Hebiah Third |
| Mohammed Bin Rashid City | Al Merkadh |

These were corroborated from public listing platforms that publish DLD sector
names, not read off a DLD gazetteer, so treat them as a good starting map
rather than as authority. Two known gaps to close against real data:

- **Arabian Ranches** spans two sectors. Ranches 1 is Wadi Al Safa 6 and
  Ranches 2 is Wadi Al Safa 7, and the seed maps only the first, so a query on
  the community name currently misses half its market. Splitting it into two
  area rows, or teaching the linker a many-to-one mapping, is the fix.
- **Dubai Hills Estate** sits inside the wider Mohammed Bin Rashid City
  programme, and Hadaeq Sheikh Mohammed Bin Rashid is a large sector. Some
  transactions in it may belong to neighbouring districts.

The mappings were verified end to end against a real Postgres instance: the
migrations were applied, both seeds loaded, a probe transaction inserted per
community under its sector name, and `link_transactions_to_areas()` resolved
all ten to the right community. That proves the join key is wired correctly.
It does not prove the sector names are the ones the DLD actually publishes,
which only a real sync can.

## Photography

The 13 photographs in `public/photos` are supplied by the client and processed
by `scripts/build-photos.mjs`, which writes AVIF and WebP at four widths plus a
JPEG fallback. `src/lib/photos.ts` is the catalogue and carries the alt text,
the intrinsic ratio and a tone flag that tells a section whether the frame can
hold light type. No stock-photo service is called at runtime and no image is
hotlinked.

The overhaul brief specifies 21; 13 arrived in the two asset drops and the
client has said more are coming. Adding them means dropping the files into
`assets-source/photos`, running the build script and adding the entry to the
catalogue. Nothing else needs to change.

## Fonts

Instrument Sans and EB Garamond, with Golos Text, Amiri, Noto Sans Arabic and
Noto Serif Devanagari for the other scripts, are self-hosted under
`public/fonts` and fetched by `scripts/fetch-fonts.mjs`, which records where
each file came from. Nothing loads from a font CDN at runtime.

-- Real Dubai developers and communities, as editorial content.
--
-- What this file is, and just as importantly what it is not.
--
-- It carries descriptive, checkable facts about the ten developers DLX
-- transacts with and the ten communities it covers: when a company was
-- founded, who master-planned a district, what a place actually is. Every
-- statement here can be checked against a public source, and the sources are
-- named in `docs/DATA-SOURCES.md` next to the claim they support.
--
-- It carries no prices, no yields, no transaction counts and no legal or visa
-- thresholds. Those are not editorial content. Market figures reach the site
-- through the Dubai Land Department pipeline and land in `area_stats` with
-- their provenance stored alongside them, which is what lets a page say
-- "Source: Dubai Land Department" honestly, or say plainly that a figure is
-- illustrative when it is not. A hand-written seed is the last place a number
-- like that belongs, and putting one here would make the site cite the DLD for
-- something the DLD never said.
--
-- `dld_area_name` is the join key the transaction linker uses, and it is set
-- here only where it is not already set. The names are the DLD sector names a
-- community sits in (Downtown Dubai transacts as "Burj Khalifa", Dubai Marina
-- as "Marsa Dubai"), corroborated from public listings rather than read off a
-- DLD gazetteer, so treat them as a good starting map that the first real sync
-- can correct rather than as authority.
--
-- Idempotent. Existing rows keep anything a human has edited in the admin;
-- this only fills fields that are still empty, so re-running is safe and
-- never overwrites editorial work.
--
-- Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/developers-and-communities-seed.sql

begin;

-- Developers -----------------------------------------------------------------
--
-- `is_partner` marks the ones whose marks appear on the site. It is a claim
-- about who we transact with, so it is set deliberately rather than for
-- everyone in the table.

insert into public.developers
  (slug, name, name_ar, summary, description, website_url, founded_year, is_partner, is_published, published_at)
values
(
  'emaar-properties',
  'Emaar Properties',
  'إعمار العقارية',
  'Dubai''s largest developer and the master-planner behind Downtown Dubai, Dubai Hills Estate and Dubai Creek Harbour.',
  'Founded in 1997 and listed on the Dubai Financial Market, Emaar built the Burj Khalifa and The Dubai Mall and master-planned four of the communities most buyers arrive already knowing: Downtown Dubai, Dubai Marina, Emirates Living and Arabian Ranches. Dubai Hills Estate and Dubai Creek Harbour are joint ventures with Meraas and Dubai Holding respectively. For a buyer the practical point is depth of secondary market: an Emaar community usually has enough recorded resale activity to price a unit from the record rather than from an asking price.',
  'https://www.emaar.com',
  1997,
  true,
  true,
  now()
),
(
  'damac-properties',
  'DAMAC Properties',
  'داماك العقارية',
  'A privately held Dubai developer known for branded residences and for the DAMAC Hills, DAMAC Lagoons and DAMAC Islands master communities.',
  'Founded in 2002, DAMAC built much of its name on branded residences, partnering its towers and villa communities with fashion and automotive houses. Its master communities sit further out than the central districts, which is the trade a buyer is actually making there: more space and a lower entry price against a younger secondary market and a longer road into town.',
  'https://www.damacproperties.com',
  2002,
  true,
  true,
  now()
),
(
  'nakheel',
  'Nakheel',
  'نخيل',
  'The master developer of Palm Jumeirah, Jumeirah Village Circle and the wider reclaimed-island portfolio.',
  'Established in 2003 and now part of Dubai Holding, Nakheel is the developer behind Palm Jumeirah, Palm Jebel Ali, The World, Jumeirah Village Circle, International City and Jumeirah Lake Towers. Its projects are master plans rather than single buildings, so the thing to read before buying in one is the stage the surrounding plan has reached: an address inside a half-built district and the same address inside a finished one are two different assets.',
  'https://www.nakheel.com',
  2003,
  true,
  true,
  now()
),
(
  'sobha-realty',
  'Sobha Realty',
  'صوبها ريلتي',
  'A backward-integrated developer, building in-house rather than through main contractors, best known in Dubai for Sobha Hartland.',
  'The Sobha group began in 1976 and its Dubai arm is headquartered in the emirate. Its distinguishing practice is backward integration: design, engineering and much of the construction are handled in-house rather than tendered to a main contractor, which is the reason its build quality is usually discussed separately from its pricing. Sobha Hartland, inside Mohammed Bin Rashid City, is its principal Dubai master community.',
  'https://www.sobharealty.com',
  1976,
  true,
  true,
  now()
),
(
  'meraas',
  'Meraas',
  'مِراس',
  'A Dubai Holding developer behind City Walk, Bluewaters, La Mer and Port de La Mer, and a joint-venture partner on Dubai Hills Estate.',
  'Founded in 2007 and now part of Dubai Holding, Meraas builds destinations as much as residences: City Walk, Bluewaters Island, La Mer and the Jumeirah Bay and Pearl Jumeirah addresses. Its stock is concentrated and low-rise by Dubai standards, so supply in a Meraas district tends to be tighter than in a tower community, which shows up in how a resale is priced.',
  'https://www.meraas.com',
  2007,
  true,
  true,
  now()
),
(
  'ellington-properties',
  'Ellington Properties',
  'إلينغتون العقارية',
  'A design-led boutique developer working mainly in Jumeirah Village Circle, Downtown Dubai and the Palm.',
  'Founded in 2014, Ellington positions itself as a design-first developer and builds at a smaller scale than the master-planners: individual buildings with a considered specification rather than districts. That makes its stock easier to assess unit by unit and harder to compare, because a boutique building has fewer directly equivalent resales in the record than a tower in a large community does.',
  'https://ellingtonproperties.ae',
  2014,
  true,
  true,
  now()
),
(
  'binghatti',
  'Binghatti',
  'بن غاطي',
  'An Emirati family developer with a recognisable architectural signature, building at volume across Jumeirah Village Circle, Business Bay and Al Jaddaf.',
  'Founded in 2008 by Hussain Binghatti, the company is known for a distinctive interlocking balcony motif that makes its buildings identifiable from the road, and more recently for branded towers in Business Bay. It launches and delivers at pace, so the questions worth asking in a Binghatti building are the ones about the specific tower and its handover date rather than about the developer in general.',
  'https://www.binghatti.com',
  2008,
  true,
  true,
  now()
),
(
  'azizi-developments',
  'Azizi Developments',
  'عزيزي للتطوير العقاري',
  'A high-volume private developer concentrated in Al Furjan, Dubai Healthcare City and along the Meydan and Sheikh Zayed Road corridors.',
  'Founded in 2013, Azizi builds mid-market apartment stock in quantity. Its communities are where a first purchase in Dubai is often made, and the two things that decide whether one of them works as an investment are the same two things in every mid-market district: what the service charge actually is, and how much of the surrounding plan has been delivered.',
  'https://azizidevelopments.com',
  2013,
  false,
  true,
  now()
),
(
  'danube-properties',
  'Danube Properties',
  'دانوب العقارية',
  'The property arm of the Danube group, which introduced the one percent monthly payment plan to Dubai''s mid-market.',
  'Danube Group was founded in 1993 by Rizwan Sajan as a building-materials trader in Deira; Danube Properties followed in 2014. It is the developer most associated with the one percent per month payment structure, which is a financing shape rather than a discount: it lowers what a buyer needs up front and does not change what the unit is worth. Its stock is fitted-out mid-market apartments, usually delivered furnished.',
  'https://danubeproperties.com',
  2014,
  false,
  true,
  now()
),
(
  'select-group',
  'Select Group',
  'سيليكت غروب',
  'A private developer concentrated on waterfront towers in Dubai Marina and Business Bay.',
  'Select Group builds tall on tight waterfront plots, principally in Dubai Marina, and has been active in the emirate since 2002. Its buildings are conventional in the useful sense: enough of them have traded often enough that a valuation in one can be built from recorded comparables rather than from a brochure.',
  'https://select-group.ae',
  2002,
  true,
  true,
  now()
)
on conflict (slug) do update set
  name_ar      = coalesce(public.developers.name_ar, excluded.name_ar),
  summary      = coalesce(public.developers.summary, excluded.summary),
  description  = coalesce(public.developers.description, excluded.description),
  website_url  = coalesce(public.developers.website_url, excluded.website_url),
  founded_year = coalesce(public.developers.founded_year, excluded.founded_year),
  is_partner   = public.developers.is_partner or excluded.is_partner,
  updated_at   = now();

-- Communities ----------------------------------------------------------------
--
-- Six of these already exist from `market-sample.sql`, which sets only the DLD
-- mapping and the coordinates. This adds the editorial content to those and
-- creates the four that were missing, with the same coalesce discipline.

insert into public.areas
  (slug, name, name_ar, summary, description, dld_area_name, latitude, longitude, is_published, published_at)
values
(
  'downtown-dubai',
  'Downtown Dubai',
  'وسط مدينة دبي',
  'Emaar''s central district, built around the Burj Khalifa and The Dubai Mall, and the address most international buyers name first.',
  'Downtown is the most recognised address in the city and prices accordingly. It transacts in the Dubai Land Department record under the sector name Burj Khalifa, which is worth knowing when reading raw DLD data, because a search for "Downtown Dubai" returns nothing. What a buyer is paying for here is liquidity and recognition rather than space: units are smaller than the money buys further out, and they are easier to let and easier to sell again.',
  'Burj Khalifa',
  25.197200, 55.274400, true, now()
),
(
  'business-bay',
  'Business Bay',
  'الخليج التجاري',
  'A mixed commercial and residential district on the Dubai Canal, master-planned by Dubai Properties and immediately south of Downtown.',
  'Business Bay was planned as a business district and has become a dense residential one, which is the source of both its appeal and its variance: a canal-facing tower and a landlocked one a street apart are not the same asset, and the record shows it. It is where DLX keeps its office. Stock ranges from studio investment units to large canal-front apartments, so anyone comparing a Business Bay price to a Business Bay average is comparing it to a number that describes almost nothing.',
  'Business Bay',
  25.185700, 55.276600, true, now()
),
(
  'dubai-marina',
  'Dubai Marina',
  'دبي مارينا',
  'A high-density waterfront district of towers around an artificial marina, master-planned by Emaar.',
  'The Marina transacts under the DLD sector name Marsa Dubai. It is one of the deepest secondary markets in the city: enough towers, enough units and enough recorded sales that a valuation can be built almost entirely from comparables. The practical questions in a Marina purchase are about the specific building, not the district: the service charge, the view line and whether the tower has a chiller charge on top.',
  'Marsa Dubai',
  25.080500, 55.140300, true, now()
),
(
  'palm-jumeirah',
  'Palm Jumeirah',
  'نخلة جميرا',
  'Nakheel''s reclaimed palm-shaped island, the city''s prime beachfront address, with villas on the fronds and apartments on the trunk.',
  'The Palm is a supply-constrained market, which is the whole of its investment case: no more fronds are being built. That constraint is also why the fronds and the trunk behave like two different markets, and why an average across the island is not a useful number for either. Beach access, plot orientation and whether a villa has been rebuilt are what separate two apparently comparable prices here.',
  'Palm Jumeirah',
  25.112400, 55.139000, true, now()
),
(
  'dubai-hills-estate',
  'Dubai Hills Estate',
  'دبي هيلز إستيت',
  'A golf-course master community of roughly 2,700 acres, developed jointly by Emaar and Meraas between Al Khail Road and Downtown.',
  'Dubai Hills is planned around an 18-hole championship course, with apartment districts on the edges and villa neighbourhoods inside. Its long-term programme runs to tens of thousands of homes, so the district a unit sits in matters more than the community name: some neighbourhoods are complete and trading normally, others are still delivering. It transacts under the DLD sector name Hadaeq Sheikh Mohammed Bin Rashid.',
  'Hadaeq Sheikh Mohammed Bin Rashid',
  25.104200, 55.246900, true, now()
),
(
  'jumeirah-village-circle',
  'Jumeirah Village Circle',
  'قرية جميرا الدائرية',
  'A Nakheel-planned mid-market community between Al Khail Road, Sheikh Mohammed Bin Zayed Road and Hessa Street.',
  'JVC is where a large share of Dubai''s mid-market apartment supply has been built, by many developers rather than one, and it is still filling in: full completion is not expected until around 2030. That is the thing to check before buying here, because an address beside a finished park and an address beside an active site are priced by the same district average and lived in very differently. It transacts under the DLD sector name Al Barsha South Fourth.',
  'Al Barsha South Fourth',
  25.059200, 55.208800, true, now()
),
(
  'dubai-creek-harbour',
  'Dubai Creek Harbour',
  'مرسى خور دبي',
  'A waterfront master plan on Ras Al Khor by Emaar and Dubai Holding, larger in land area than Downtown and delivering in districts over a long horizon.',
  'Creek Harbour is planned across nine districts and is being delivered over a horizon measured in a decade or more, next to the Ras Al Khor wildlife sanctuary. Buying here is buying into a plan as much as a building, so the two questions that matter are which district a unit is in and what has actually been handed over around it. Its DLD sector name is Al Khairan First.',
  'Al Khairan First',
  25.198900, 55.348900, true, now()
),
(
  'arabian-ranches',
  'Arabian Ranches',
  'المرابع العربية',
  'An established Emaar villa community off Sheikh Mohammed Bin Zayed Road, and one of the first family suburbs built in the emirate.',
  'Arabian Ranches is a mature, low-rise villa market with schools, a golf course and a settled resale history, which makes it one of the more readable communities in Dubai: there is enough recorded trade in each villa type to price one properly. The phases matter for the record. The original community transacts under the DLD sector name Wadi Al Safa 6 and Arabian Ranches 2 under Wadi Al Safa 7, so a search on one name misses half the market.',
  'Wadi Al Safa 6',
  25.049700, 55.267100, true, now()
),
(
  'damac-hills',
  'DAMAC Hills',
  'داماك هيلز',
  'A DAMAC villa and apartment master community built around the Trump International golf course, west of Dubailand.',
  'DAMAC Hills trades space against distance: plots and layouts are generous for the money by central-Dubai standards, and the drive into town is real. It is a mixed community rather than a villa-only one, so the apartment stock and the villa stock behave differently in the record and should not be read through a single district figure. Its DLD sector name is Al Hebiah Third.',
  'Al Hebiah Third',
  25.026500, 55.248800, true, now()
),
(
  'mohammed-bin-rashid-city',
  'Mohammed Bin Rashid City',
  'مدينة محمد بن راشد',
  'A large master development between Downtown and Meydan, containing District One, Sobha Hartland and a crystal lagoon.',
  'MBR City is an umbrella over several separately developed districts rather than one community, which is why a price quoted for "MBR City" says very little on its own: District One villas and Sobha Hartland apartments are different markets that happen to share a name. It is close in to Downtown, which is most of its case. It transacts under the DLD sector name Al Merkadh.',
  'Al Merkadh',
  25.171700, 55.293300, true, now()
)
on conflict (slug) do update set
  name_ar       = coalesce(public.areas.name_ar, excluded.name_ar),
  summary       = coalesce(public.areas.summary, excluded.summary),
  description   = coalesce(public.areas.description, excluded.description),
  dld_area_name = coalesce(public.areas.dld_area_name, excluded.dld_area_name),
  latitude      = coalesce(public.areas.latitude, excluded.latitude),
  longitude     = coalesce(public.areas.longitude, excluded.longitude),
  updated_at    = now();

commit;

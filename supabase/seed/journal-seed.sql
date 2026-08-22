-- Journal seed — six opening posts for /blog.
--
-- Written to give the journal a real starting shelf rather than an empty page,
-- and deliberately observational: process, judgement and the questions worth
-- asking. None of them quotes a price, a yield or a legal threshold, because
-- the market figures on this site come from the DLD pipeline and the legal
-- ones from `src/data/fee-schedule.ts` — a hand-written post is the last place
-- either belongs.
--
-- `on conflict (slug) do nothing` so re-running this never overwrites
-- something the team has since edited in the admin editor.
--
-- Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/journal-seed.sql

begin;

insert into public.blog_posts
  (slug, title, excerpt, body, category, tags, reading_minutes, is_published, published_at)
values
(
  'service-charge-nobody-checks',
  'The number nobody checks until it is too late',
  'Service charges decide what an apartment actually costs to own, and they are the one figure that rarely gets read before an offer is accepted.',
  '## The offer is the easy part

Most buyers arrive with a price in mind and negotiate hard to reach it. Almost none of them ask for the building''s service charge schedule before the offer is accepted, which is strange, because that schedule decides what the apartment costs every year for as long as they own it.

Two apartments at the same price in the same community can differ meaningfully in what they cost to hold. The difference is not a mystery — it is written down, per square foot, and it is a matter of record.

## What to ask for

Ask for the current schedule, and ask what it was two and three years ago. A charge that has moved steadily is telling you something about how the building is run. A charge that jumped is telling you something louder.

- The current rate per square foot, and what it covers.
- The three previous years, so you can see the direction.
- Whether there is a reserve fund, and what condition it is in.
- Any special assessment raised or discussed in the last two years.

> A building with a healthy reserve fund and a boring charge history is worth paying slightly more for. You are buying the management as much as the apartment.

## Why this sits with us

We ask for it as a matter of course, before an offer goes in, and we read it. It is not glamorous work and it does not close a deal faster. It is simply the difference between knowing what you are buying and hoping.

If you want the arithmetic on a specific building, the [buying costs calculator](/tools/buying-costs) covers the one-off side, and our guide to [service charges](/guides/service-charges-explained) explains what the schedule is actually telling you.',
  'buying',
  array['service charges', 'due diligence', 'apartments'],
  4, true, timestamptz '2026-08-04 09:00:00+04'
),
(
  'what-happens-at-the-trustee-office',
  'What actually happens at the trustee office',
  'The transfer itself is the shortest part of a Dubai purchase, and the part clients worry about most. Here is what the day looks like.',
  '## The day itself

By the time a transfer appointment is booked, the work is done. The sale agreement is signed, the developer''s No Objection Certificate is issued, the funds are in the right form, and the appointment exists because every prior step cleared.

What happens at the registration trustee office is administrative. Identities are checked, the manager''s cheques are handed over, the paperwork is processed, and the title is registered in the buyer''s name. It usually takes less time than the drive there.

## What people worry about

Clients ask three things, almost always in this order.

- Do I have to be there? Not necessarily — a properly drafted power of attorney covers it, and it should be arranged early rather than the week before.
- What if the seller does not turn up? That is what the sale agreement and the deposit are for, and it is the reason the agreement matters more than anyone expects.
- When is it mine? On registration. Not on the offer, not on the agreement, not on the cheque.

## The part worth your attention

The transfer is not where deals go wrong. Deals go wrong earlier — in a title that says something different from the listing, in a service charge arrears nobody checked, in an NOC that takes three weeks because the developer has a backlog.

Our guide to [the buying process for overseas buyers](/guides/buying-process-overseas-buyers) sets out the sequence in full, including the steps that can be handled remotely.',
  'buying',
  array['process', 'transfer', 'overseas buyers'],
  4, true, timestamptz '2026-07-21 09:00:00+04'
),
(
  'reading-the-market-without-a-headline',
  'Reading the market without a headline',
  'Dubai property headlines move faster than Dubai property. A short note on which figures are worth watching and which are noise.',
  '## Records are not trends

A record sale is a single transaction. It tells you what one buyer paid for one exceptional asset on one day, and it tells you almost nothing about what your two-bedroom in a mid-market community is worth.

The figures that matter are duller: transaction volume, median price per square foot in a specific community, and the direction both have moved over several quarters. Those come from the registry, they are recorded rather than asserted, and they are slow enough to be useful.

## Where our numbers come from

Every market figure on this site is computed from Dubai Land Department open data, and every page that shows one states when it was last updated. Where a figure is illustrative rather than recorded, the page says that too, in as many words.

That policy costs us the occasional confident-sounding sentence. We think it is a fair trade: a number without a source is decoration.

## What to do with it

Look at the community you care about, over as long a window as the data allows, and ask what changed and why. Then ask someone who was in the room for those transactions. The registry tells you what happened; it does not tell you what a specific building is like to own.

Our [market intelligence](/market-intelligence) pages carry the community figures, and each one ends with a plain answer rather than a chart.',
  'market',
  array['dld', 'data', 'method'],
  4, true, timestamptz '2026-07-02 09:00:00+04'
),
(
  'payment-plans-read-properly',
  'Off-plan payment plans, read properly',
  'A payment plan is a schedule, not a discount. What to check before you let one decide which project you buy.',
  '## The plan is a cash-flow question

Off-plan payment plans are quoted as headline splits — so much during construction, so much on handover, so much after. Read as marketing, they all sound similar. Read as a schedule, they are very different from one another.

What matters is when each instalment actually falls due, what triggers it, and what happens to the ones after handover if your circumstances change.

- Is each instalment tied to a construction milestone or to a calendar date?
- What is due at handover, and is that the largest single payment?
- Does anything remain payable after handover, and for how long?
- What happens if a milestone slips — does the schedule slip with it?

## Attractive is not the same as suitable

A long post-handover plan is genuinely useful to a buyer whose income is steady and who intends to hold. It is a liability to someone who planned to exit at handover and finds the market flat that quarter.

> Choose the plan that matches how you intend to hold the property, not the one with the smallest first cheque.

## Work it through

Our [payment plan tool](/tools/payment-plan) lays a schedule out so you can see what falls where, and the guide to [off-plan versus ready](/guides/off-plan-vs-ready) covers the trade-off underneath the schedule.',
  'investment',
  array['off-plan', 'payment plans', 'developers'],
  5, true, timestamptz '2026-06-16 09:00:00+04'
),
(
  'what-we-tell-clients-about-the-golden-visa',
  'What we tell clients who ask about the Golden Visa',
  'The honest version: what a brokerage can help with, what it cannot, and why we will not tell you whether you qualify.',
  '## We will not tell you that you qualify

We are asked constantly, and the answer is always the same. We are a brokerage. We can tell you what a property costs, what the title says, and what it is worth. Whether a specific purchase supports a specific residency application, for a specific person, is a question for a licensed immigration adviser — and the answer needs to be in writing before you buy on the strength of it.

That is not caution for its own sake. Thresholds, conditions on mortgaged and off-plan property, and documentation all change. A sentence written confidently on a website last year can be wrong this year, and the person who pays for that is the reader.

## What we can do

- Show you which properties sit comfortably above a threshold rather than at it.
- Make sure the title and the paperwork are in the state an application expects.
- Introduce you to advisers who do this properly, and stay involved while they do.
- Structure the purchase with the residency objective on the table from the start, rather than discovered halfway through.

## The tool, and its limits

Our [Golden Visa checker](/tools/golden-visa-eligibility) indicates which route a value falls near. It deliberately does not return a verdict, because a verdict is exactly the thing we are not qualified to give. The [guide](/guides/golden-visa-guide) explains how the property routes work in principle, and carries the date it was reviewed.',
  'golden_visa',
  array['golden visa', 'residency', 'advice'],
  4, true, timestamptz '2026-05-28 09:00:00+04'
),
(
  'renting-before-you-buy',
  'The case for renting for a year first',
  'Most families who buy in their first month regret the community, not the purchase. A year of renting is cheaper than moving twice.',
  '## Communities are not interchangeable

Dubai''s communities differ in ways that no floor plan communicates: the commute at eight in the morning, whether the neighbours are permanent or seasonal, how the place feels in August, how far the school run really is.

People who move here and buy immediately usually buy well. They just occasionally buy in the wrong place — and correcting that costs a full round of transaction costs on both sides plus the disruption of moving a family twice.

## What a year buys you

- A commute you have actually driven, at the hour you will drive it.
- A summer, which is the season that decides how you feel about a home here.
- A school place confirmed rather than hoped for, which often decides the community anyway.
- Time to watch what actually transacts in the communities you are considering.

> We say this knowing it delays a sale. It is still the right advice more often than not.

## If you are set on buying now

Then buy something liquid. A property with a wide natural buyer pool is far easier to leave if the community turns out not to suit you, and that optionality is worth more than the last five per cent of negotiation.

Our [rent versus buy tool](/tools/rent-vs-buy) puts numbers on the wait, and the [relocation guide](/guides/relocating-to-dubai) covers the sequence that tends to work.',
  'relocation',
  array['relocation', 'families', 'renting'],
  4, true, timestamptz '2026-05-12 09:00:00+04'
)
on conflict (slug) do nothing;

commit;

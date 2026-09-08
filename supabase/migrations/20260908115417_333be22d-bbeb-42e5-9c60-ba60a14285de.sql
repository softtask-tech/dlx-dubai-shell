-- Price, rent per area, service charge and yield.
--
-- The publication that shipped carried six metrics: counts of registered
-- sales, counts of registered tenancies, the median registered annual rent,
-- and their period changes. The analysis behind it (reports/dld/phase3a)
-- defined sixteen. Every price metric, the yield and the service charge were
-- specified and never built, and the site's copy grew up around the gap: it
-- tells readers it will "rather leave a figure out than invent one", and tells
-- buyers to go and ask a developer for a service charge figure that sits in
-- 91,193 rows of open data DLX already holds.
--
-- This adds the missing scope so those metrics can be published. It grants no
-- new access and changes no existing row: `dld_market_scope_allowed` is the
-- gate every public function already passes through, and a metric absent from
-- this registry is refused no matter what lands in the table.
--
-- The aggregates themselves are built by scripts/build-dld-aggregates.py from
-- the raw Dubai Land Department exports, under the same rules as the existing
-- publication: medians rather than means, nothing below a minimum observation
-- count, and nothing finer than a community.

insert into public.dld_market_scope_registry values
  -- Sale prices. Segmented the same way registered_sale_count already is, so a
  -- reader can move between "how many sold" and "what they went for" without
  -- the ground shifting under them.
  ('dubai','quarter','median_price_per_sqft','all',array['all'],30,'amount','Dubai price level'),
  ('dubai','quarter','median_price_per_sqft','sale_registration',array['existing','off_plan'],30,'amount','Dubai price by registration'),
  ('dubai','quarter','median_price_per_sqft','property_class',array['apartment','villa'],30,'amount','Dubai price by property class'),
  ('dubai','quarter','median_sale_price','all',array['all'],30,'amount','Dubai ticket size'),
  ('dubai','quarter','median_sale_price','sale_registration',array['existing','off_plan'],30,'amount','Dubai ticket size by registration'),
  ('dubai','quarter','median_sale_price','property_class',array['apartment','villa'],30,'amount','Dubai ticket size by property class'),

  ('community','quarter','median_price_per_sqft','all',array['all'],30,'amount','Community price level'),
  ('community','quarter','median_price_per_sqft','sale_registration',array['existing','off_plan'],30,'amount','Community price by registration'),
  ('community','quarter','median_price_per_sqft','property_class',array['apartment','villa'],30,'amount','Community price by property class'),
  ('community','quarter','median_sale_price','all',array['all'],30,'amount','Community ticket size'),

  -- Rent expressed per square foot, which is the only form in which a rent is
  -- comparable between a studio and a four-bedroom villa.
  ('dubai','quarter','median_rent_per_sqft','all',array['all'],30,'amount','Dubai rent level'),
  ('community','quarter','median_rent_per_sqft','all',array['all'],30,'amount','Community rent level'),

  -- The cost of holding the asset. Published yearly because it is a budget
  -- that is set once a year, not a market that moves inside one.
  ('community','year','median_service_charge_sqft','all',array['all'],30,'amount','Community holding cost'),

  -- Gross, and labelled gross everywhere it is shown. The service charge is
  -- published beside it as its own figure so a reader subtracts it themselves,
  -- rather than being handed a net yield resting on assumptions we made for
  -- them about voids, management and maintenance.
  ('community','quarter','gross_rental_yield_pct','all',array['all'],30,'amount','Community gross yield'),
  ('dubai','quarter','gross_rental_yield_pct','all',array['all'],30,'amount','Dubai gross yield')
on conflict do nothing;
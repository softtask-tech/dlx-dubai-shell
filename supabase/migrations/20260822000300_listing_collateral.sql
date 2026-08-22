-- Collateral the listing and project pages need, and the specialities shown on
-- a consultant's profile.

alter table properties
  add column floor_plan_url text,
  add column brochure_url text;

alter table projects
  add column brochure_url text,
  add column floor_plan_url text;

-- "Off-plan investment", "Palm Jumeirah villas", "Relocation" — what a
-- consultant is actually known for, shown on the team page.
alter table agents
  add column specialities text[] not null default '{}';

-- Developers we actively represent, for the partnership strip on public pages.
alter table developers
  add column is_partner boolean not null default false;

create index developers_partner_idx on developers (is_partner) where is_partner;

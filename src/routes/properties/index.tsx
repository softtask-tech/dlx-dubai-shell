import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { listAreas } from "@/data/catalogue";
import { listProperties, type PropertyFilters } from "@/data/properties";
import type { Area } from "@/data/types";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { useTrackedView } from "@/lib/use-tracked-view";
import { Reveal } from "@/components/site/reveal";
import { PropertyCard } from "@/components/site/property-card";
import { TrustStrip } from "@/components/site/trust-strip";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * Filters live in the URL rather than in component state, so a filtered view is
 * shareable, survives a refresh, and is rendered on the server, which is also
 * what lets a crawler see a real page of listings instead of an empty shell.
 */
const searchSchema = z.object({
  for: z.enum(["sale", "rent"]).optional(),
  type: z
    .enum(["apartment", "villa", "townhouse", "penthouse", "duplex", "plot", "office", "retail"])
    .optional(),
  area: z.string().optional(),
  beds: z.coerce.number().int().min(0).max(10).optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  offplan: z.enum(["yes", "no"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

type PropertySearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/properties/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const filters: PropertyFilters = {};
    if (deps.for) filters.listingType = deps.for;
    if (deps.type) filters.propertyType = deps.type;
    if (deps.area) filters.area = deps.area;
    if (deps.beds !== undefined) filters.bedrooms = deps.beds;
    if (deps.min !== undefined) filters.minPrice = deps.min;
    if (deps.max !== undefined) filters.maxPrice = deps.max;
    if (deps.offplan) filters.offPlan = deps.offplan === "yes";
    if (deps.sort) filters.sort = deps.sort;

    /* Both queries are public and independent, so they go together. */
    const [properties, areas] = await Promise.all([listProperties(filters), listAreas()]);
    return { properties, areas };
  },
  head: () =>
    pageHead({ path: "/properties", breadcrumbs: [{ name: "Properties", path: "/properties" }] }),
  component: PropertiesIndex,
});

const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "duplex",
  "plot",
  "office",
  "retail",
] as const;

const PRICE_BANDS = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Under AED 2M", min: undefined, max: 2_000_000 },
  { label: "AED 2M - 5M", min: 2_000_000, max: 5_000_000 },
  { label: "AED 5M - 10M", min: 5_000_000, max: 10_000_000 },
  { label: "AED 10M+", min: 10_000_000, max: undefined },
] as const;

function PropertiesIndex() {
  const { properties, areas } = Route.useLoaderData();
  const search = Route.useSearch();

  /* Only a filtered view counts as a search. Landing on the unfiltered index
   * is browsing, and reporting it as a search would drown the real signal. */
  const filtered = Object.keys(search).length > 0;
  useTrackedView(
    "search_listings",
    {
      contentName: new URLSearchParams(search as Record<string, string>).toString(),
      value: properties.length,
    },
    filtered,
  );

  return (
    <>
      <Section className="pt-44 pb-16 lg:pt-56">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Portfolio</Eyebrow>
              <h1 className="display-1 mt-8">Properties</h1>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.12}>
              <p className="body-text text-muted-foreground">
                A curated selection across Dubai's prime districts. Some of what we represent is
                never advertised, if you don't see it here, ask.
              </p>
              <div className="mt-10 h-px w-16 bg-accent" />
            </Reveal>
          </div>
        </div>
      </Section>

      <FilterBar search={search} areas={areas} />

      <Section className="pt-12">
        {properties.length === 0 ? (
          <EmptyState hasFilters={Object.keys(search).length > 0} />
        ) : (
          <>
            <p className="caption">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </p>
            <div className="mt-10 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, index) => (
                <Reveal key={property.id} delay={stagger(index % 3)}>
                  <PropertyCard property={property} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Section>

      <TrustStrip />
    </>
  );
}

/**
 * The filter bar. Every control is a link, not a form: changing a filter is a
 * navigation, which keeps the URL authoritative and means the whole thing works
 * before JavaScript loads.
 */
function FilterBar({ search, areas }: { search: PropertySearch; areas: Area[] }) {
  return (
    <Section flush className="border-y border-border">
      <div className="mx-auto w-full max-w-shell px-6 py-6 md:px-10 lg:px-16">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
          <FilterGroup label="For">
            <FilterLink search={search} patch={{ for: undefined }} active={!search.for}>
              All
            </FilterLink>
            <FilterLink search={search} patch={{ for: "sale" }} active={search.for === "sale"}>
              Buy
            </FilterLink>
            <FilterLink search={search} patch={{ for: "rent" }} active={search.for === "rent"}>
              Rent
            </FilterLink>
          </FilterGroup>

          <FilterGroup label="Type" htmlFor="filter-type">
            <FilterSelect
              id="filter-type"
              value={search.type ?? ""}
              options={[
                { value: "", label: "Any type" },
                ...PROPERTY_TYPES.map((type) => ({ value: type, label: humaniseType(type) })),
              ]}
              toSearch={(value) => ({ ...search, type: (value || undefined) as never })}
            />
          </FilterGroup>

          <FilterGroup label="Community" htmlFor="filter-community">
            <FilterSelect
              id="filter-community"
              value={search.area ?? ""}
              options={[
                { value: "", label: "All communities" },
                ...areas.map((area) => ({ value: area.slug, label: area.name })),
              ]}
              toSearch={(value) => ({ ...search, area: value || undefined })}
            />
          </FilterGroup>

          <FilterGroup label="Beds" htmlFor="filter-beds">
            <FilterSelect
              id="filter-beds"
              value={search.beds === undefined ? "" : String(search.beds)}
              options={[
                { value: "", label: "Any" },
                { value: "0", label: "Studio" },
                ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` })),
              ]}
              toSearch={(value) => ({
                ...search,
                beds: value === "" ? undefined : Number(value),
              })}
            />
          </FilterGroup>

          <FilterGroup label="Price" htmlFor="filter-price">
            <FilterSelect
              id="filter-price"
              value={priceBandValue(search)}
              options={PRICE_BANDS.map((band, index) => ({
                value: String(index),
                label: band.label,
              }))}
              toSearch={(value) => {
                const band = PRICE_BANDS[Number(value)] ?? PRICE_BANDS[0];
                return { ...search, min: band?.min, max: band?.max };
              }}
            />
          </FilterGroup>

          <FilterGroup label="Stage">
            <FilterLink search={search} patch={{ offplan: undefined }} active={!search.offplan}>
              Any
            </FilterLink>
            <FilterLink search={search} patch={{ offplan: "no" }} active={search.offplan === "no"}>
              Ready
            </FilterLink>
            <FilterLink
              search={search}
              patch={{ offplan: "yes" }}
              active={search.offplan === "yes"}
            >
              Off-plan
            </FilterLink>
          </FilterGroup>

          <div className="ml-auto flex items-center gap-6">
            <FilterGroup label="Sort" htmlFor="filter-sort">
              <FilterSelect
                id="filter-sort"
                value={search.sort ?? "newest"}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "price_asc", label: "Price ↑" },
                  { value: "price_desc", label: "Price ↓" },
                ]}
                toSearch={(value) => ({ ...search, sort: value as PropertySearch["sort"] })}
              />
            </FilterGroup>
            {Object.keys(search).length > 0 ? (
              <Link to="/properties" search={{}} className="eyebrow link-underline text-accent">
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * A labelled row of filter controls.
 *
 * The label is a real `<label>` bound to the control by id, not a `<span>` that
 * merely sits beside it. The audit caught this: five selects on this page had a
 * visible label a sighted reader could see and no accessible name at all, so a
 * screen reader announced each of them as "combo box" and nothing else.
 *
 * `htmlFor` is optional because the group also wraps link-based filters, which
 * carry their own names.
 */
function FilterGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="eyebrow">
          {label}
        </label>
      ) : (
        <span className="eyebrow">{label}</span>
      )}
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

function FilterLink({
  search,
  patch,
  active,
  children,
}: {
  search: PropertySearch;
  patch: Partial<PropertySearch>;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/properties"
      search={{ ...search, ...patch }}
      className={
        active
          ? "eyebrow text-foreground underline decoration-accent underline-offset-4"
          : "eyebrow text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}

/**
 * A select that navigates. Rendered inside a `<noscript>`-safe form would be
 * heavier than it is worth here, so it falls back to the links above it when
 * JavaScript is unavailable.
 */
function FilterSelect({
  id,
  value,
  options,
  toSearch,
}: {
  id: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  toSearch: (value: string) => PropertySearch;
}) {
  const navigate = Route.useNavigate();

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => {
        void navigate({ search: toSearch(event.target.value) });
      }}
      className="eyebrow cursor-pointer border-0 bg-transparent text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function priceBandValue(search: PropertySearch): string {
  const index = PRICE_BANDS.findIndex((band) => band.min === search.min && band.max === search.max);
  return String(index === -1 ? 0 : index);
}

function humaniseType(type: string): string {
  return type.replace(/^\w/, (character) => character.toUpperCase());
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="border border-border p-12 text-center">
      <Eyebrow>Nothing here yet</Eyebrow>
      <h2 className="display-3 mt-6">
        {hasFilters ? "No properties match that." : "The portfolio is being prepared."}
      </h2>
      <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
        {hasFilters
          ? "Try widening the filters, or tell us what you are looking for and we will go and find it, including properties that are never advertised."
          : "Listings will appear here shortly. In the meantime, tell us what you are looking for and we will come back to you directly."}
      </p>
      <div className="mt-10 flex justify-center gap-6">
        {hasFilters ? (
          <Link to="/properties" search={{}} className="eyebrow link-underline text-foreground">
            Clear filters
          </Link>
        ) : null}
        <Link to="/contact" className="eyebrow link-underline text-accent">
          Tell us what you need
        </Link>
      </div>
    </div>
  );
}

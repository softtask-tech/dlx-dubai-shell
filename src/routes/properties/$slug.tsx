import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { getProperty, listRelatedProperties } from "@/data/properties";
import type { PropertyWithRelations } from "@/data/types";
import { site } from "@/config/site";
import { formatArea, formatBedrooms, formatRent, humanise } from "@/lib/format";
import { Price } from "@/components/tools/money";
import { listingSchema } from "@/lib/schema";
import { pageHead } from "@/lib/seo";
import { stagger } from "@/lib/motion";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Gallery } from "@/components/site/gallery";
import { useTrackedView } from "@/lib/use-tracked-view";
import { ContactLink } from "@/components/site/contact-link";
import { Reveal } from "@/components/site/reveal";
import { PropertyCard } from "@/components/site/property-card";
import { Button } from "@/components/ui/button";
import { Section, Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

export const Route = createFileRoute("/properties/$slug")({
  loader: async ({ params }) => {
    const property = await getProperty(params.slug);
    if (!property) throw notFound();
    const related = await listRelatedProperties(property);
    return { property, related };
  },
  head: ({ loaderData }) => {
    const property = loaderData?.property;
    if (!property) return {};

    const location = property.area?.name ?? "Dubai";
    const summary =
      property.summary ??
      `${formatBedrooms(property.bedrooms)} ${humanise(property.property_type).toLowerCase()} in ${location}, represented by ${site.name}.`;

    return pageHead({
      path: `/properties/${property.slug}`,
      title: property.title,
      description: summary.slice(0, 160),
      tagline: `${location} · ${formatRent(property.price, property.currency, property.rent_frequency)}`,
      image: property.hero_image_url ?? "/og/properties.png",
      breadcrumbs: [
        { name: "Properties", path: "/properties" },
        { name: property.title, path: `/properties/${property.slug}` },
      ],
      schema: [
        listingSchema({
          name: property.title,
          description: summary,
          path: `/properties/${property.slug}`,
          image: property.hero_image_url ?? "/og/properties.png",
          area: location,
          ...(property.bedrooms !== null ? { bedrooms: property.bedrooms } : {}),
          ...(property.bathrooms !== null ? { bathrooms: property.bathrooms } : {}),
          ...(property.built_up_sqft !== null ? { floorAreaSqFt: property.built_up_sqft } : {}),
          ...(property.price !== null
            ? { price: { amount: property.price, currency: property.currency } }
            : {}),
        }),
      ],
    });
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { property, related } = Route.useLoaderData();

  /* A listing view is the strongest interest signal a portfolio site has, and
   * it is what builds the retargeting audience worth spending on. */
  useTrackedView("view_listing", {
    contentIds: [property.slug],
    contentName: property.title,
    currency: property.currency,
    ...(property.price !== null ? { value: property.price } : {}),
  });
  const images = [property.hero_image_url, ...property.image_urls].filter((url): url is string =>
    Boolean(url),
  );

  return (
    <>
      {/* Full-bleed opening plate */}
      <div className="relative h-[70svh] w-full overflow-hidden bg-muted">
        {images[0] ? (
          <img
            src={images[0]}
            alt={property.title}
            fetchPriority="high"
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-background/20" />
        <div className="relative flex h-full items-end pb-14">
          <Container>
            <div className="flex flex-wrap items-center gap-3">
              <Tag variant="soft">{property.area?.name ?? "Dubai"}</Tag>
              {property.completion_status === "off_plan" ? (
                <Tag variant="soft">Off-plan</Tag>
              ) : null}
              {property.status !== "available" ? (
                <Tag variant="outline">{humanise(property.status)}</Tag>
              ) : null}
            </div>
            <h1 className="display-1 mt-6 max-w-4xl">{property.title}</h1>
          </Container>
        </div>
      </div>

      {/* Facts and the agent panel, side by side */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="display-3">
                <Price
                  amount={property.price}
                  currency={property.currency}
                  frequency={property.rent_frequency}
                />
              </p>
              {property.summary ? (
                <p className="lead mt-8 text-muted-foreground">{property.summary}</p>
              ) : null}
            </Reveal>

            <Reveal delay={0.1}>
              <dl className="mt-12 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
                <Fact label="Bedrooms" value={formatBedrooms(property.bedrooms)} />
                <Fact
                  label="Bathrooms"
                  value={property.bathrooms === null ? "—" : String(property.bathrooms)}
                />
                <Fact label="Built-up area" value={formatArea(property.built_up_sqft)} />
                {property.plot_sqft !== null ? (
                  <Fact label="Plot" value={formatArea(property.plot_sqft)} />
                ) : null}
                <Fact label="Type" value={humanise(property.property_type)} />
                <Fact label="Furnishing" value={humanise(property.furnishing)} />
                {property.view ? <Fact label="View" value={property.view} /> : null}
                {property.floor ? <Fact label="Floor" value={property.floor} /> : null}
                {property.handover_year ? (
                  <Fact label="Handover" value={String(property.handover_year)} />
                ) : null}
              </dl>
            </Reveal>

            {property.description ? (
              <Reveal delay={0.15}>
                <div className="mt-14">
                  <Eyebrow>The property</Eyebrow>
                  {property.description.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="body-text mt-6 max-w-measure">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {property.amenities.length > 0 ? (
              <Reveal delay={0.2}>
                <div className="mt-14">
                  <Eyebrow>Amenities</Eyebrow>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {property.amenities.map((amenity) => (
                      <Tag key={amenity}>{amenity}</Tag>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <AgentPanel property={property} />
            </Reveal>
          </aside>
        </div>
      </Section>

      {images.length > 1 ? <Gallery images={images} title={property.title} /> : null}

      {/* Floor plan and brochure */}
      {property.floor_plan_url || property.brochure_url ? (
        <Section className="bg-secondary">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Reveal>
                <Eyebrow>Documents</Eyebrow>
              </Reveal>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              {property.floor_plan_url ? (
                <Reveal>
                  <figure>
                    <img
                      src={property.floor_plan_url}
                      alt={`Floor plan for ${property.title}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full bg-background"
                    />
                    <figcaption className="caption mt-4">Floor plan</figcaption>
                  </figure>
                </Reveal>
              ) : null}
              {property.brochure_url ? (
                <Reveal delay={0.1}>
                  <a
                    href={property.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow link-underline mt-10 inline-block text-foreground"
                  >
                    Download the brochure (PDF)
                  </a>
                </Reveal>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {/* Location */}
      {property.latitude !== null && property.longitude !== null ? (
        <Section>
          <Reveal>
            <Eyebrow>Location</Eyebrow>
            <h2 className="display-3 mt-6">{property.area?.name ?? "Dubai"}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 aspect-[16/9] w-full border border-border">
              <iframe
                title={`Map showing ${property.title}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01}%2C${property.latitude - 0.008}%2C${property.longitude + 0.01}%2C${property.latitude + 0.008}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
              />
            </div>
            <p className="caption mt-4">
              Approximate location. Exact address shared with qualified buyers.
            </p>
          </Reveal>
        </Section>
      ) : null}

      {/* Enquiry */}
      <Section className="bg-secondary" id="enquire">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow>Enquire</Eyebrow>
              <h2 className="display-2 mt-6">Arrange a viewing.</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                In person or on video, whichever suits. We will confirm availability and answer
                anything the listing does not.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="listing_enquiry"
                sourceDetail={property.slug}
                propertyId={property.id}
                defaultIntent={property.listing_type === "rent" ? "rent" : "buy"}
                title={`Enquire about ${property.title}`}
                description="Tell us when suits and how to reach you. A consultant replies personally."
                submitLabel="Request a viewing"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section>
          <Reveal>
            <Eyebrow>Also available</Eyebrow>
          </Reveal>
          <div className="mt-10 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry, index) => (
              <Reveal key={entry.id} delay={stagger(index)}>
                <PropertyCard property={entry} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Dubai law requires the DLD permit on every advertised listing. */}
      {property.dld_permit_number || property.reference ? (
        <Section flush className="border-t border-border py-10">
          <Container>
            <p className="caption">
              {property.reference ? `Reference ${property.reference}` : null}
              {property.reference && property.dld_permit_number ? " · " : null}
              {property.dld_permit_number
                ? `DLD permit number ${property.dld_permit_number}`
                : null}
            </p>
          </Container>
        </Section>
      ) : null}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="body-text mt-2 text-foreground">{value}</dd>
    </div>
  );
}

/** The named consultant on the listing, with every route to reach them. */
function AgentPanel({ property }: { property: PropertyWithRelations }) {
  const agent = property.agent;
  const whatsappNumber = (agent?.whatsapp ?? site.contact.phoneE164).replace(/[^\d]/g, "");
  const whatsappText = encodeURIComponent(
    `Hello DLX, I'd like to know more about ${property.title} (${property.slug}).`,
  );

  return (
    <div className="border border-border p-8">
      <Eyebrow>Your consultant</Eyebrow>

      {agent ? (
        <>
          <div className="mt-6 flex items-center gap-5">
            {agent.photo_url ? (
              <img
                src={agent.photo_url}
                alt={agent.full_name}
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="h-18 w-18 object-cover"
              />
            ) : null}
            <div>
              <p className="display-3">{agent.full_name}</p>
              {agent.job_title ? <p className="caption mt-1">{agent.job_title}</p> : null}
            </div>
          </div>
          {agent.brn ? <p className="caption mt-5">RERA BRN {agent.brn}</p> : null}
        </>
      ) : (
        <p className="body-text mt-6 text-muted-foreground">
          A consultant will be assigned as soon as you get in touch.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <Button asChild>
          <a href="#enquire">Request a viewing</a>
        </Button>
        <ContactLink
          kind="whatsapp"
          href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
          detail={`listing-${property.slug}`}
          className="eyebrow link-underline text-foreground"
        >
          Message on WhatsApp
        </ContactLink>
        <ContactLink
          kind="call"
          href={`tel:${agent?.phone ?? site.contact.phoneE164}`}
          detail={`listing-${property.slug}`}
          className="eyebrow link-underline text-foreground"
        >
          {agent?.phone ?? site.contact.phone}
        </ContactLink>
      </div>

      <p className="caption mt-8">
        Prefer to browse first?{" "}
        <Link to="/properties" search={{}} className="link-underline text-foreground">
          Back to the portfolio
        </Link>
      </p>
    </div>
  );
}

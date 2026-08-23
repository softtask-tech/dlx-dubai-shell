import { Link } from "@tanstack/react-router";

import { formatArea, formatBedrooms } from "@/lib/format";
import { Price } from "@/components/tools/money";
import type { PropertyWithRelations } from "@/data/types";
import { Card, CardMedia } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";

/**
 * A listing as it appears in the portfolio grid.
 *
 * The whole card is one link, and the image sits in a fixed frame so a mixed
 * bag of uploaded photography still lines up in a grid.
 */
export function PropertyCard({ property }: { property: PropertyWithRelations }) {
  return (
    <Card interactive className="border-0">
      <Link
        to="/properties/$slug"
        params={{ slug: property.slug }}
        className="flex h-full flex-col"
      >
        <CardMedia ratio="4 / 3">
          {property.hero_image_url ? (
            <img
              src={property.hero_image_url}
              alt={property.title}
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
            />
          ) : null}
        </CardMedia>

        <div className="flex flex-1 flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Tag variant="bare">{property.area?.name ?? "Dubai"}</Tag>
            {property.completion_status === "off_plan" ? <Tag variant="soft">Off-plan</Tag> : null}
            {property.status !== "available" ? (
              <Tag variant="outline">{property.status.replace(/_/g, " ")}</Tag>
            ) : null}
          </div>

          <h3 className="display-3 transition-colors duration-base ease-editorial group-hover:text-accent">
            {property.title}
          </h3>

          <p className="caption mt-auto">
            {[formatBedrooms(property.bedrooms), formatArea(property.built_up_sqft)]
              .filter((part) => part !== "—")
              .join(" · ")}
          </p>

          <p className="eyebrow text-foreground">
            <Price
              amount={property.price}
              currency={property.currency}
              frequency={property.rent_frequency}
            />
          </p>
        </div>
      </Link>
    </Card>
  );
}

import { Reveal } from "@/components/motion";
import { PropertyCard } from "@/components/site/property-card";
import type { PropertyWithRelations } from "@/data/types";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The portfolio, laid out with a rhythm instead of as a wall of equal cards.
 *
 * Three identical columns repeated down a page is the single most recognisable
 * template shape there is, and on a brokerage it does something worse than look
 * generic: it makes a thirty-four million dirham villa and a seven hundred
 * thousand dirham studio the same size on screen, which is not what either
 * buyer came to see.
 *
 * So the grid runs in pairs across twelve columns and the emphasis alternates,
 * 7/5 on one row and 5/7 on the next. Every row is exactly full, which is the
 * property that matters: a rhythm built from a repeating cycle of odd spans
 * leaves a hole at the end whenever the count does not divide, and a hole in a
 * grid reads as a bug rather than as space. Pairs always divide, and an odd
 * final listing takes the full width and closes the page on a wide frame
 * rather than on a gap.
 *
 * The image ratio follows the span, because a portrait plate in a wide cell and
 * a landscape one in a narrow cell are both crops nobody chose.
 */
export function ListingGrid({ properties }: { properties: readonly PropertyWithRelations[] }) {
  const count = properties.length;

  return (
    <div className="grid gap-x-8 gap-y-16 lg:grid-cols-12">
      {properties.map((property, i) => {
        const isLoneLast = i === count - 1 && count % 2 === 1;
        /* Row parity decides which side of the pair is the wide one. */
        const wideFirst = Math.floor(i / 2) % 2 === 0;
        const wide = i % 2 === 0 ? wideFirst : !wideFirst;

        const span = isLoneLast ? "lg:col-span-12" : wide ? "lg:col-span-7" : "lg:col-span-5";
        /* Square rather than portrait for the narrow cell. A 4/5 plate beside
           a 4/3 one is about a hundred pixels taller before the caption is
           counted, and because both share a grid row the shorter card leaves
           that difference as a hole under itself. A square still reads as a
           different frame and costs almost nothing in height. */
        const ratio = isLoneLast ? "16 / 9" : wide ? "4 / 3" : "1 / 1";

        return (
          <div key={property.id} className={cn("sm:col-span-1", span)}>
            <Reveal delay={stagger(i % 2)}>
              <PropertyCard property={property} ratio={ratio} />
            </Reveal>
          </div>
        );
      })}
    </div>
  );
}

import { ArrowUpRight } from "lucide-react";

import { site } from "@/config/site";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/ui/section";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Where a buyer can check us, and what each place has verified.
 *
 * Almost everything this site says about DLX is DLX saying it. This is the
 * one block that is not: three third parties confirming the firm is
 * registered with them, two of which award a badge against their own criteria
 * rather than ours. On a site whose whole argument is "check the record", the
 * firm's own credentials were the one claim with no record behind them.
 *
 * It is written the way a buyer actually behaves. Nobody reads an "our
 * credentials" panel; everybody types the agency name into the portal they
 * were already using. So the section says that out loud and hands them the
 * links, which costs us nothing and is worth more than any seal we could draw.
 *
 * NO LOGOS, DELIBERATELY. A portal's mark rendered from a file we found is
 * both a trademark question and, at these sizes, three mismatched rasters in a
 * row. The portal's name set in the page's own display face reads better and
 * claims less. The badge is a word, ruled in gold, sitting next to the name of
 * whoever awarded it, and the whole row is a link to the profile where it can
 * be seen.
 *
 * A ROW, NOT A CARD. Every other trust block on this site is a grid of equal
 * tiles, and a fourth would be the template again. These are three
 * destinations, so they are set as a ledger: the name at display size, what
 * that place verified beside it, and the row itself is the door.
 */
export function PortalProof({ className }: { className?: string }) {
  /* No empty guard. `brand.ts` ends in `as const`, so `portals` is a readonly
   * tuple and its `length` is the literal 3 — comparing that to 0 is a type
   * error, not a runtime check. If the list is ever emptied, the compiler will
   * say so here rather than the page rendering an empty rule. */
  const portals = site.portals;

  return (
    <Section data-surface="cream" className={className}>
      <Reveal>
        <h2 className="display-2 max-w-[20ch] text-balance">
          You are going to look us up. Here is where.
        </h2>
        <p className="body-text mt-7 max-w-measure text-muted-foreground">
          Every other claim on this site is ours. These three are not: each one is a portal
          confirming we are registered with them, and two award a badge on their own criteria.
          Open any of them and check.
        </p>
      </Reveal>

      <ul className="mt-14 list-none border-t border-border p-0">
        {portals.map((portal, index) => (
          <Reveal key={portal.label} delay={stagger(index)}>
            <li className="border-b border-border">
              <a
                href={portal.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "focus-ring group grid items-baseline gap-x-8 gap-y-3 py-8",
                  "transition-[padding-inline-start,background-color] duration-quick ease-editorial",
                  "hover:bg-paper hover:ps-4 md:grid-cols-12 md:py-10",
                )}
              >
                <span className="display-2 md:col-span-4">{portal.label}</span>

                <span className="md:col-span-3">
                  {portal.badge ? (
                    <span className="eyebrow inline-flex items-center border border-gold-ink px-3 py-1.5 text-gold-ink">
                      {portal.badge}
                    </span>
                  ) : (
                    <span className="eyebrow text-muted-foreground">Agency profile</span>
                  )}
                </span>

                <span className="body-text text-muted-foreground md:col-span-4">{portal.note}</span>

                <span className="eyebrow flex items-center gap-2 text-gold-ink md:col-span-1 md:justify-end">
                  <span className="md:sr-only">Open profile</span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 transition-transform duration-quick ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            </li>
          </Reveal>
        ))}
      </ul>

      <Reveal>
        <p className="caption mt-8 max-w-measure text-muted-foreground">
          Badges are awarded by the portals themselves, on their own criteria, and can be withdrawn
          by them. We show the name of whoever awarded each one rather than a seal of our own,
          because a mark you cannot trace is not evidence of anything.
        </p>
      </Reveal>
    </Section>
  );
}

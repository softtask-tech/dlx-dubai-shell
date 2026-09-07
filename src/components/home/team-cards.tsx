import { Link } from "@tanstack/react-router";

/**
 * The people, as cards with real weight.
 *
 * The second layout the brief singles out. What it was: names, roles and BRNs
 * in flat cells separated by thin rules, which is a spreadsheet. The point of
 * this section is that a small team is an advantage, so the four people have to
 * look like people rather than rows in a register.
 *
 * What gives a card presence here is deliberately not a shadow: an accent bar
 * across the top, an initials disc, and the BRN set as a badge rather than as
 * another line of grey text. The BRN is the part worth promoting to a badge,
 * because it is the checkable fact, and this site's argument is that its claims
 * can be checked.
 *
 * The disc carries initials rather than a photograph because there are no
 * headshots yet. It is sized and positioned exactly where a portrait will go,
 * so real photographs drop in later without the layout moving.
 *
 * Two up on a phone, not one. The card is compact enough that a single column
 * would push the fourth person two screens down for no gain.
 */
export type TeamMember = {
  slug: string;
  name: string;
  role: string | null;
  brn: string | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamCards({ members }: { members: readonly TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {members.map((member) => (
        <li key={member.slug}>
          <Link
            to="/team/$slug"
            params={{ slug: member.slug }}
            className="focus-ring group block h-full border border-border bg-paper transition-[transform,box-shadow,border-color] duration-quick ease-editorial hover:-translate-y-1 hover:border-gold hover:shadow-[0_20px_40px_rgba(0,0,0,.08)]"
          >
            <span
              aria-hidden
              className="block h-1.5 bg-gradient-to-r from-green-mid to-gold"
            />
            <span className="block p-5 sm:p-6">
              <span
                aria-hidden
                className="font-display mb-5 grid size-13 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--gold),var(--green-mid))] text-lg text-white"
              >
                {initials(member.name)}
              </span>
              <span className="display-3 block transition-colors group-hover:text-gold-deep">
                {member.name}
              </span>
              {member.role ? (
                <span className="caption mt-1 block text-muted-foreground">{member.role}</span>
              ) : null}
              {member.brn ? (
                <span className="eyebrow mt-3 inline-block bg-cream px-2.5 py-1 text-gold-ink">
                  BRN {member.brn}
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

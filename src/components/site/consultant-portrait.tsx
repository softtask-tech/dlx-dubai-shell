import type { Agent } from "@/data/types";

/**
 * A consultant's portrait, or a designed stand-in for one.
 *
 * Headshots are not in yet. The alternative to a placeholder is a grey box,
 * which reads as an unfinished website rather than as a firm that has simply
 * not photographed its people this quarter, so the stand-in is drawn: the
 * consultant's initials set in the brand's serif on paper, in the same frame
 * the real photograph will occupy. When a photo arrives it drops in and
 * nothing around it moves.
 */
export function ConsultantPortrait({
  agent,
  eager = false,
  className = "",
}: {
  agent: Pick<Agent, "full_name" | "photo_url">;
  eager?: boolean;
  className?: string;
}) {
  const initials = agent.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={`aspect-[4/5] overflow-hidden bg-secondary ${className}`}>
      {agent.photo_url ? (
        <img
          src={agent.photo_url}
          alt={agent.full_name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center border border-border"
        >
          <span className="display-1 text-accent/70 select-none">{initials}</span>
        </div>
      )}
    </div>
  );
}

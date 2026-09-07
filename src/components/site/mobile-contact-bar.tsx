import { MessageCircle, Sparkles } from "lucide-react";
import { useLocale } from "@/i18n";

/**
 * The two things a reader on a phone is most likely to want, always in reach.
 *
 * Same material as the masthead, at the other end of the screen, so the page
 * is held between two pieces of the same glass rather than a dark bar at the
 * top and a pale one at the bottom. It sits above the safe area on a notched
 * phone, and the footer reserves matching space so nothing is covered.
 */
export function MobileContactBar() {
  const { code, pathIn } = useLocale();
  return (
    <aside
      aria-label="Contact DLX"
      data-surface="dark"
      data-glass-bar=""
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <a
        href={pathIn(code, "/contact")}
        className="focus-ring flex min-h-12 items-center justify-center gap-2 border-e border-border text-sm font-medium text-on-dark"
      >
        <MessageCircle aria-hidden className="size-4" />
        Speak to DLX
      </a>
      <a
        href="#ask"
        className="focus-ring flex min-h-12 items-center justify-center gap-2 text-sm font-medium text-gold"
      >
        <Sparkles aria-hidden className="size-4" />
        Ask DLX AI
      </a>
    </aside>
  );
}

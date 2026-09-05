import { MessageCircle, Sparkles } from "lucide-react";
import { useLocale } from "@/i18n";

export function MobileContactBar() {
  const { code, pathIn } = useLocale();
  return (
    <aside
      aria-label="Contact DLX"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background/96 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <a
        href={pathIn(code, "/contact")}
        className="focus-ring flex min-h-11 items-center justify-center gap-2 border-r border-border text-sm font-medium"
      >
        <MessageCircle aria-hidden className="size-4" />
        Speak to DLX
      </a>
      <a
        href="#ask"
        className="focus-ring flex min-h-11 items-center justify-center gap-2 text-sm font-medium"
      >
        <Sparkles aria-hidden className="size-4" />
        Ask DLX AI
      </a>
    </aside>
  );
}

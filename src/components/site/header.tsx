import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Services", to: "/services" },
  { label: "Market Intelligence", to: "/market-intelligence" },
  { label: "Guides", to: "/guides" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled
          ? "border-b border-border/70 bg-background/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6 md:px-10 lg:px-16">
        <Link
          to="/"
          className="font-display text-2xl leading-none tracking-[0.3em] text-foreground"
          onClick={() => setOpen(false)}
        >
          DLX
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="eyebrow link-underline text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="eyebrow text-foreground lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav className="flex flex-col gap-6 px-6 py-10">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

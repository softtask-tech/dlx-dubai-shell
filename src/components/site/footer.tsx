import { Link } from "@tanstack/react-router";
import { Container, Eyebrow } from "@/components/ui/section";
import { NAV_LINKS } from "./header";

const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "YouTube", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-20 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl tracking-[0.3em]">DLX</p>
            <p className="mt-6 max-w-sm font-display text-2xl leading-snug text-foreground/80">
              Dubai real estate, handled with intention.
            </p>
            <p className="mt-8 text-sm text-muted-foreground">RERA ORN 40905</p>
          </div>

          <div className="lg:col-span-3">
            <Eyebrow>Navigate</Eyebrow>
            <ul className="mt-6 space-y-3">
              {NAV_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-foreground/70 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>Contact</Eyebrow>
            <ul className="mt-6 space-y-3 text-sm text-foreground/70">
              <li>Dubai, United Arab Emirates</li>
              <li>+971 (0) 000 0000</li>
              <li>hello@dlxproperties.ae</li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>Social</Eyebrow>
            <ul className="mt-6 space-y-3 text-sm text-foreground/70">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="transition-colors hover:text-accent">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="eyebrow">© {new Date().getFullYear()} DLX Properties</p>
          <p className="eyebrow">Brokerage · Advisory · Private Sales</p>
        </div>
      </Container>
    </footer>
  );
}

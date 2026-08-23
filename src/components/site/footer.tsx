import { Link } from "@tanstack/react-router";
import { site } from "@/config/site";
import { trackContactHref } from "./contact-link";
import { Container, Eyebrow } from "@/components/ui/section";
import { ALL_NAV_LINKS } from "./header";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-20 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl tracking-monogram">{site.shortName}</p>
            <p className="lead mt-6 max-w-measure text-foreground/80">{site.tagline}</p>
            <p className="caption mt-8">RERA ORN {site.reraOrn}</p>
          </div>

          <div className="lg:col-span-3">
            <Eyebrow>Navigate</Eyebrow>
            <nav aria-label="Footer">
              <ul className="mt-6 space-y-3">
                {ALL_NAV_LINKS.map((item) => (
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
            </nav>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>Contact</Eyebrow>
            <address className="mt-6 space-y-3 text-sm not-italic text-foreground/70">
              <p>
                {site.address.street}, {site.address.locality}
                <br />
                {site.address.countryName}
              </p>
              <p>
                <a
                  href={`tel:${site.contact.phoneE164}`}
                  onClick={() => trackContactHref(`tel:${site.contact.phoneE164}`, "footer")}
                  className="transition-colors hover:text-accent"
                >
                  {site.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="transition-colors hover:text-accent"
                >
                  {site.contact.email}
                </a>
              </p>
            </address>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>Social</Eyebrow>
            <ul className="mt-6 space-y-3 text-sm text-foreground/70">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="eyebrow">
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="eyebrow">Brokerage · Advisory · Private Sales</p>
        </div>
      </Container>
    </footer>
  );
}

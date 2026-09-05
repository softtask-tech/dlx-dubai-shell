import { ArrowUpRight, Search } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui/section";

const routes = [
  {
    title: "Private portfolio",
    body: "See residences currently published by DLX.",
    href: "/properties",
  },
  {
    title: "Off-plan",
    body: "Browse verified releases when commercial inventory is available.",
    href: "/off-plan",
  },
  {
    title: "Communities",
    body: "Understand the places before comparing the properties.",
    href: "/areas",
  },
] as const;

export function DiscoveryPanel() {
  return (
    <section
      aria-labelledby="discovery-title"
      className="border-b border-border bg-background py-12 md:py-16"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <Eyebrow>Start with the decision</Eyebrow>
            <h2 id="discovery-title" className="display-2 mt-4">
              Find the right route into Dubai property.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <form
              action="/directory"
              method="get"
              className="flex flex-col gap-3 border-b border-input pb-3 sm:flex-row sm:items-end"
            >
              <label htmlFor="global-directory-search" className="min-w-0 flex-1">
                <span className="eyebrow">Search official property data</span>
                <input
                  id="global-directory-search"
                  name="q"
                  maxLength={160}
                  placeholder="Developer, project, broker or official number"
                  className="mt-2 h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
              </label>
              <button
                type="submit"
                className="focus-ring touch-target flex items-center justify-center gap-2 bg-foreground px-6 text-sm font-medium text-background"
              >
                <Search aria-hidden className="size-4" />
                Search
              </button>
            </form>
          </div>
        </div>
        <div className="mt-10 grid border-y border-border md:grid-cols-3">
          {routes.map((route) => (
            <a
              key={route.href}
              href={route.href}
              className="focus-ring group border-b border-border py-7 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0"
            >
              <span className="flex items-center justify-between font-medium">
                {route.title}
                <ArrowUpRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </span>
              <span className="caption mt-2 block max-w-xs text-muted-foreground">
                {route.body}
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

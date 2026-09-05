export type NavigationItem = { label: string; href: string; description?: string };
export type NavigationGroup = { label: string; items: readonly NavigationItem[] };

/** Only useful live destinations belong here. Future IA is documented, not exposed. */
export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    label: "Properties",
    items: [
      {
        label: "Private portfolio",
        href: "/properties",
        description: "Published and privately represented homes.",
      },
      {
        label: "Off-plan",
        href: "/off-plan",
        description: "Verified commercial inventory when available.",
      },
      {
        label: "Advisory services",
        href: "/services",
        description: "Acquisition, disposal and portfolio advice.",
      },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Communities", href: "/areas", description: "Area guides and available evidence." },
      { label: "Developers", href: "/developers", description: "Commercial developer profiles." },
      { label: "Dubai guides", href: "/guides", description: "Buying, owning and relocating." },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Market overview",
        href: "/market-intelligence",
        description: "Published evidence and methodology.",
      },
      { label: "Calculators", href: "/tools", description: "Purchase, mortgage and yield tools." },
      { label: "Journal", href: "/blog", description: "Analysis from the DLX desk." },
    ],
  },
  {
    label: "Property data",
    items: [
      {
        label: "Official DLD directory",
        href: "/directory",
        description: "Independent access to dated open-data records.",
      },
      { label: "Developers", href: "/directory/developers" },
      { label: "Projects", href: "/directory/projects" },
      { label: "Brokers", href: "/directory/brokers" },
      { label: "Offices", href: "/directory/offices" },
      { label: "Licences", href: "/directory/licences" },
      { label: "Permits", href: "/directory/permits" },
    ],
  },
] as const;

export const FOOTER_GROUPS = [
  ...NAVIGATION_GROUPS,
  {
    label: "DLX",
    items: [
      { label: "About", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;

export const NAVIGATION_DESTINATIONS = new Set(
  FOOTER_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
);

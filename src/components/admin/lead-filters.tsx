/**
 * The inbox filter bar.
 *
 * One object holds every filter, and the same object is sent to the list and
 * to the export, so a spreadsheet can never disagree with the screen it was
 * taken from.
 */
import type { LeadIntent, LeadSourceType, LeadStatus, LeadTimeline } from "@/data/types";
import type { Agent } from "@/data/types";
import { humanise } from "@/lib/format";
import { Select, TextInput } from "@/components/forms/fields";

export type LeadFilterState = {
  status: LeadStatus | "";
  temperature: "hot" | "warm" | "cold" | "";
  search: string;
  createdFrom: string;
  createdTo: string;
  sourceType: LeadSourceType | "";
  utmSource: string;
  utmCampaign: string;
  intent: LeadIntent | "";
  timeline: LeadTimeline | "";
  budgetMin: string;
  budgetMax: string;
  assignedAgentId: string;
  notified: "" | "yes" | "no";
};

export const EMPTY_FILTERS: LeadFilterState = {
  status: "",
  temperature: "",
  search: "",
  createdFrom: "",
  createdTo: "",
  sourceType: "",
  utmSource: "",
  utmCampaign: "",
  intent: "",
  timeline: "",
  budgetMin: "",
  budgetMax: "",
  assignedAgentId: "",
  notified: "",
};

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "viewing_booked",
  "negotiating",
  "won",
  "lost",
  "unqualified",
];

const SOURCE_TYPES: readonly LeadSourceType[] = [
  "contact_form",
  "valuation_form",
  "listing_enquiry",
  "guide_download",
  "calculator",
  "market_report",
  "ai_chat",
  "voice_call",
  "whatsapp",
  "referral",
  "other",
];

const INTENTS: readonly LeadIntent[] = ["buy", "sell", "rent", "invest", "relocate", "advice"];

const TIMELINES: readonly LeadTimeline[] = [
  "immediately",
  "within_3_months",
  "within_12_months",
  "researching",
];

/** What the server function accepts: only the filters actually set. */
export type LeadFilterPayload = {
  status?: LeadStatus;
  temperature?: "hot" | "warm" | "cold";
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sourceType?: LeadSourceType;
  utmSource?: string;
  utmCampaign?: string;
  intent?: LeadIntent;
  timeline?: LeadTimeline;
  budgetMin?: number;
  budgetMax?: number;
  assignedAgentId?: string;
  notified?: boolean;
};

export function toFilterPayload(filters: LeadFilterState): LeadFilterPayload {
  const payload: LeadFilterPayload = {};
  if (filters.status) payload.status = filters.status;
  if (filters.temperature) payload.temperature = filters.temperature;
  if (filters.search.trim()) payload.search = filters.search.trim();
  if (filters.createdFrom) payload.createdFrom = filters.createdFrom;
  if (filters.createdTo) payload.createdTo = filters.createdTo;
  if (filters.sourceType) payload.sourceType = filters.sourceType;
  if (filters.utmSource.trim()) payload.utmSource = filters.utmSource.trim();
  if (filters.utmCampaign.trim()) payload.utmCampaign = filters.utmCampaign.trim();
  if (filters.intent) payload.intent = filters.intent;
  if (filters.timeline) payload.timeline = filters.timeline;

  const min = Number(filters.budgetMin);
  if (filters.budgetMin && Number.isFinite(min)) payload.budgetMin = min;
  const max = Number(filters.budgetMax);
  if (filters.budgetMax && Number.isFinite(max)) payload.budgetMax = max;

  if (filters.assignedAgentId) payload.assignedAgentId = filters.assignedAgentId;
  if (filters.notified) payload.notified = filters.notified === "yes";
  return payload;
}

export function activeFilterCount(filters: LeadFilterState): number {
  return Object.values(toFilterPayload(filters)).filter((value) => value !== undefined).length;
}

/** Dubai's today, not the browser's, so a date range means the working day. */
function dubaiToday(): Date {
  const now = new Date();
  return new Date(now.getTime() + (4 * 60 + now.getTimezoneOffset()) * 60_000);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = dubaiToday();
  date.setDate(date.getDate() - days);
  return iso(date);
}

const QUICK_RANGES: ReadonlyArray<[label: string, range: () => { from: string; to: string }]> = [
  ["Today", () => ({ from: iso(dubaiToday()), to: iso(dubaiToday()) })],
  ["Last 7 days", () => ({ from: daysAgo(6), to: iso(dubaiToday()) })],
  ["Last 30 days", () => ({ from: daysAgo(29), to: iso(dubaiToday()) })],
  [
    "This month",
    () => {
      const today = dubaiToday();
      return { from: `${iso(today).slice(0, 7)}-01`, to: iso(today) };
    },
  ],
  ["All time", () => ({ from: "", to: "" })],
];

export function LeadFilterBar({
  filters,
  agents,
  onChange,
  onReset,
}: {
  filters: LeadFilterState;
  agents: readonly Agent[];
  onChange: (next: LeadFilterState) => void;
  onReset: () => void;
}) {
  function set<K extends keyof LeadFilterState>(key: K, value: LeadFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const active = activeFilterCount(filters);

  return (
    <div className="mt-10 border-y border-border py-6">
      <div className="flex flex-wrap items-end gap-6">
        <Labelled label="Status">
          <Select
            value={filters.status}
            onChange={(event) => set("status", event.target.value as LeadStatus | "")}
          >
            <option value="">All</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {humanise(value)}
              </option>
            ))}
          </Select>
        </Labelled>

        <Labelled label="Temperature">
          <Select
            value={filters.temperature}
            onChange={(event) =>
              set("temperature", event.target.value as LeadFilterState["temperature"])
            }
          >
            <option value="">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </Labelled>

        <Labelled label="Search" className="flex-1 min-w-[16rem]">
          <TextInput
            placeholder="Name, email or phone"
            value={filters.search}
            onChange={(event) => set("search", event.target.value)}
          />
        </Labelled>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <Labelled label="From">
          <TextInput
            type="date"
            value={filters.createdFrom}
            onChange={(event) => set("createdFrom", event.target.value)}
          />
        </Labelled>
        <Labelled label="To">
          <TextInput
            type="date"
            value={filters.createdTo}
            onChange={(event) => set("createdTo", event.target.value)}
          />
        </Labelled>
        <div className="flex flex-wrap items-center gap-4 pb-1">
          {QUICK_RANGES.map(([label, build]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                const { from, to } = build();
                onChange({ ...filters, createdFrom: from, createdTo: to });
              }}
              className="eyebrow link-underline text-muted-foreground hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <Labelled label="Source">
          <Select
            value={filters.sourceType}
            onChange={(event) => set("sourceType", event.target.value as LeadSourceType | "")}
          >
            <option value="">All</option>
            {SOURCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {humanise(value)}
              </option>
            ))}
          </Select>
        </Labelled>

        <Labelled label="Ad source">
          <TextInput
            placeholder="google, meta…"
            value={filters.utmSource}
            onChange={(event) => set("utmSource", event.target.value)}
          />
        </Labelled>

        <Labelled label="Campaign">
          <TextInput
            placeholder="Campaign name"
            value={filters.utmCampaign}
            onChange={(event) => set("utmCampaign", event.target.value)}
          />
        </Labelled>

        <Labelled label="Intent">
          <Select
            value={filters.intent}
            onChange={(event) => set("intent", event.target.value as LeadIntent | "")}
          >
            <option value="">All</option>
            {INTENTS.map((value) => (
              <option key={value} value={value}>
                {humanise(value)}
              </option>
            ))}
          </Select>
        </Labelled>

        <Labelled label="Timeline">
          <Select
            value={filters.timeline}
            onChange={(event) => set("timeline", event.target.value as LeadTimeline | "")}
          >
            <option value="">All</option>
            {TIMELINES.map((value) => (
              <option key={value} value={value}>
                {humanise(value)}
              </option>
            ))}
          </Select>
        </Labelled>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <Labelled label="Budget from (AED)">
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={filters.budgetMin}
            onChange={(event) => set("budgetMin", event.target.value)}
          />
        </Labelled>

        <Labelled label="Budget to (AED)">
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Any"
            value={filters.budgetMax}
            onChange={(event) => set("budgetMax", event.target.value)}
          />
        </Labelled>

        <Labelled label="Consultant">
          <Select
            value={filters.assignedAgentId}
            onChange={(event) => set("assignedAgentId", event.target.value)}
          >
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name}
              </option>
            ))}
          </Select>
        </Labelled>

        <Labelled label="Notification">
          <Select
            value={filters.notified}
            onChange={(event) => set("notified", event.target.value as LeadFilterState["notified"])}
          >
            <option value="">All</option>
            <option value="yes">Email sent</option>
            <option value="no">Not sent</option>
          </Select>
        </Labelled>

        <button
          type="button"
          onClick={onReset}
          disabled={active === 0}
          className="eyebrow link-underline pb-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {active === 0 ? "No filters" : `Clear ${active} filter${active === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}

function Labelled({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

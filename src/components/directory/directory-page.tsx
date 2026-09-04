import { PageHero } from "@/components/site/page-hero";
import { Eyebrow, Section } from "@/components/ui/section";
import {
  DIRECTORY_DISCLAIMER,
  DIRECTORY_RECORDED_LABEL,
  DIRECTORY_TYPE_LABELS,
  directoryStatusNotice,
  type DirectoryRecord,
  type DirectoryRecordType,
  type DirectorySearchResult,
} from "@/data/directory-types";
import { directoryRecordPath } from "@/data/directory-contract";

const NAV_ITEMS: readonly [string, string][] = [
  ["Developers", "/directory/developers"],
  ["Projects", "/directory/projects"],
  ["Brokers", "/directory/brokers"],
  ["Offices", "/directory/offices"],
  ["Licences", "/directory/licences"],
  ["Permits", "/directory/permits"],
  ["Valuators", "/directory/valuators"],
  ["Escrow agents", "/directory/escrow-agents"],
];

export function DirectoryPage({
  result,
  query = "",
  selectedType,
  title = "Dubai property directory",
  lead = "Search professional and project records published in Dubai Land Department open data.",
  showTypeFilter = true,
}: {
  result: DirectorySearchResult;
  query?: string;
  selectedType?: DirectoryRecordType | undefined;
  title?: string;
  lead?: string;
  showTypeFilter?: boolean;
}) {
  return (
    <>
      <PageHero photo="burj-al-arab-cloud" title={title} lead={lead} />
      <Section>
        <nav
          aria-label="Directory sections"
          className="flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-8"
        >
          <a href="/directory" className="eyebrow link-underline">
            All records
          </a>
          {NAV_ITEMS.map(([label, href]) => (
            <a key={href} href={href} className="eyebrow link-underline">
              {label}
            </a>
          ))}
        </nav>

        <form
          action={selectedType ? undefined : "/directory"}
          method="get"
          className="mt-10 grid gap-4 border border-border p-6 md:grid-cols-[1fr_14rem_auto]"
        >
          <label className="block">
            <span className="eyebrow">Name or official number</span>
            <input
              name="q"
              defaultValue={query}
              maxLength={160}
              placeholder="English, Arabic, licence or permit number"
              className="mt-3 h-12 w-full border border-input bg-background px-4 text-foreground outline-none focus:border-accent"
            />
          </label>
          {showTypeFilter ? (
            <label className="block">
              <span className="eyebrow">Record type</span>
              <select
                name="type"
                defaultValue={selectedType ?? ""}
                className="mt-3 h-12 w-full border border-input bg-background px-3"
              >
                <option value="">All record types</option>
                {Object.entries(DIRECTORY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="submit"
            className="eyebrow h-12 self-end bg-foreground px-8 text-background"
          >
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="caption text-muted-foreground">
            {result.unavailable
              ? "Directory temporarily unavailable"
              : `${result.total.toLocaleString("en-AE")} recorded result${result.total === 1 ? "" : "s"}`}
          </p>
          <p className="caption text-muted-foreground">{DIRECTORY_RECORDED_LABEL}</p>
        </div>

        {result.unavailable ? (
          <DirectoryState
            title="Directory temporarily unavailable"
            body="The public directory could not be reached. No internal database was queried and no partial record is being shown."
          />
        ) : result.records.length === 0 ? (
          <DirectoryState
            title="No matching records"
            body="Try another official name or number, remove the record-type filter, or check the spelling."
          />
        ) : (
          <div className="mt-8 border-t border-border">
            {result.records.map((record) => (
              <DirectoryRecordRow
                key={`${record.entity_type}:${record.source_key}`}
                record={record}
              />
            ))}
          </div>
        )}

        <DirectoryPagination result={result} query={query} selectedType={selectedType} />
        <p className="caption mt-12 max-w-3xl border-t border-border pt-6 text-muted-foreground">
          {DIRECTORY_DISCLAIMER}
        </p>
      </Section>
    </>
  );
}

function DirectoryRecordRow({ record }: { record: DirectoryRecord }) {
  const href = directoryRecordPath(record);
  const content = (
    <div className="grid gap-4 py-7 md:grid-cols-12 md:items-start">
      <div className="md:col-span-2">
        <span className="eyebrow">{DIRECTORY_TYPE_LABELS[record.entity_type]}</span>
      </div>
      <div className="md:col-span-5">
        <h2 className="display-3">
          {record.display_name_en ?? record.display_name_ar ?? "Official record"}
        </h2>
        {record.display_name_en && record.display_name_ar ? (
          <p lang="ar" dir="rtl" className="body-text mt-2 text-right text-muted-foreground">
            {record.display_name_ar}
          </p>
        ) : null}
      </div>
      <div className="md:col-span-3">
        {record.primary_number ? (
          <p className="caption">Official number · {record.primary_number}</p>
        ) : null}
        {record.status_en ? <p className="caption mt-2">Status · {record.status_en}</p> : null}
        {record.status_en ? (
          <p className="caption mt-2 text-muted-foreground">
            {directoryStatusNotice(record.source_export_date)}
          </p>
        ) : null}
        <RelatedSummary context={record.related_context} />
      </div>
      <div className="caption text-muted-foreground md:col-span-2 md:text-right">
        Export {record.source_export_date}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block border-b border-border transition-colors hover:border-accent">
      {content}
    </a>
  ) : (
    <article className="border-b border-border">{content}</article>
  );
}

function RelatedSummary({ context }: { context: DirectoryRecord["related_context"] }) {
  const relations = Object.entries(context).flatMap(([kind, value]) => {
    const records = Array.isArray(value) ? value : value ? [value] : [];
    return records.map((record) => ({ kind, record }));
  });
  if (!relations.length) return null;
  return (
    <div className="mt-3">
      {relations.slice(0, 3).map(({ kind, record }) => (
        <p key={`${kind}:${record.key}`} className="caption text-muted-foreground">
          {kind.replace(/_/g, " ")} · {record.name_en ?? record.name_ar ?? record.number}
        </p>
      ))}
    </div>
  );
}

function DirectoryPagination({
  result,
  query,
  selectedType,
}: {
  result: DirectorySearchResult;
  query: string;
  selectedType?: DirectoryRecordType | undefined;
}) {
  if (result.totalPages <= 1) return null;
  const link = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedType) params.set("type", selectedType);
    params.set("page", String(page));
    return `?${params.toString()}`;
  };
  return (
    <nav
      aria-label="Directory pagination"
      className="mt-10 flex items-center justify-between border-t border-border pt-6"
    >
      {result.page > 1 ? (
        <a href={link(result.page - 1)} className="eyebrow link-underline">
          Previous
        </a>
      ) : (
        <span />
      )}
      <span className="caption">
        Page {result.page} of {result.totalPages}
      </span>
      {result.page < result.totalPages ? (
        <a href={link(result.page + 1)} className="eyebrow link-underline">
          Next
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}

function DirectoryState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 border border-border p-10 text-center">
      <Eyebrow>{DIRECTORY_RECORDED_LABEL}</Eyebrow>
      <h2 className="display-3 mt-5">{title}</h2>
      <p className="body-text mx-auto mt-4 max-w-measure text-muted-foreground">{body}</p>
    </div>
  );
}

export function DirectoryDetailPage({
  result,
}: {
  result: { record: DirectoryRecord | null; unavailable: boolean };
}) {
  if (result.unavailable)
    return (
      <DirectoryDetailState
        title="Record temporarily unavailable"
        body="The public directory could not be reached. Please try again later."
      />
    );
  if (!result.record)
    return (
      <DirectoryDetailState
        title="Record not found"
        body="No public DLD directory record matches this identifier."
      />
    );
  const record = result.record;
  return (
    <>
      <PageHero
        photo="burj-al-arab-cloud"
        title={record.display_name_en ?? record.display_name_ar ?? "Official record"}
        lead={DIRECTORY_RECORDED_LABEL}
      >
        {record.display_name_en && record.display_name_ar ? (
          <p lang="ar" dir="rtl" className="lead mt-5 text-right text-on-dark-muted">
            {record.display_name_ar}
          </p>
        ) : null}
      </PageHero>
      <Section>
        <Eyebrow>{DIRECTORY_TYPE_LABELS[record.entity_type]}</Eyebrow>
        <dl className="mt-8 grid gap-8 border-y border-border py-8 md:grid-cols-3">
          <DirectoryFact label="Official number" value={record.primary_number} />
          <DirectoryFact label="Status" value={record.status_en} />
          <DirectoryFact label="Source export" value={record.source_export_date} />
          <DirectoryFact label="Valid from" value={record.valid_from} />
          <DirectoryFact label="Valid to" value={record.valid_to} />
          <DirectoryFact label="Source dataset" value={record.source_dataset} />
        </dl>
        <RelatedSummary context={record.related_context} />
        {record.status_en || record.valid_from || record.valid_to ? (
          <p className="body-text mt-10 max-w-3xl">
            {directoryStatusNotice(record.source_export_date)}
          </p>
        ) : null}
        <p className="caption mt-6 max-w-3xl text-muted-foreground">{DIRECTORY_DISCLAIMER}</p>
      </Section>
    </>
  );
}

function DirectoryFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="body-text mt-2">{value ?? "Not supplied in this official export"}</dd>
    </div>
  );
}

function DirectoryDetailState({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHero photo="burj-al-arab-cloud" title={title} lead={body} />
      <Section>
        <a href="/directory" className="eyebrow link-underline">
          Return to directory
        </a>
      </Section>
    </>
  );
}

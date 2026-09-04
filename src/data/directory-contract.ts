import type {
  DirectoryRecord,
  DirectoryRecordType,
  DirectorySearchInput,
  DirectorySearchResult,
} from "./directory-types.ts";

const ARABIC_NORMALIZATION: Record<string, string> = {
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
  ى: "ي",
  ؤ: "و",
  ئ: "ي",
};

export function normalizeDirectoryQuery(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[ًٌٍَُِّْـ]/gu, "")
    .replace(/[أإآٱىؤئ]/gu, (character) => ARABIC_NORMALIZATION[character] ?? character)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function clampDirectoryPage(value: number | undefined): number {
  return Math.max(1, Math.trunc(value ?? 1) || 1);
}

export function clampDirectoryPageSize(value: number | undefined): number {
  return Math.min(100, Math.max(1, Math.trunc(value ?? 24) || 24));
}

export function directoryRecordPath(
  record: Pick<
    DirectoryRecord,
    "entity_type" | "source_key" | "display_name_en" | "display_name_ar"
  >,
): string | null {
  const id = encodeURIComponent(record.source_key);
  switch (record.entity_type) {
    case "developer":
      return `/directory/developers/${slugPart(record.display_name_en ?? record.display_name_ar)}--${id}`;
    case "project":
      return `/directory/projects/${slugPart(record.display_name_en ?? record.display_name_ar)}--${id}`;
    case "broker":
      return `/directory/brokers/${id}`;
    case "office":
      return `/directory/offices/${id}`;
    default:
      return null;
  }
}

export function directoryKeyFromSlug(slug: string): string {
  const marker = slug.lastIndexOf("--");
  return decodeURIComponent(marker >= 0 ? slug.slice(marker + 2) : slug);
}

function slugPart(value: string | null): string {
  const normalized = normalizeDirectoryQuery(value ?? "record").replace(/\s+/g, "-");
  return normalized || "record";
}

/** Pure fixture adapter used by unit tests; production search stays server-side. */
export function searchDirectoryFixture(
  fixture: readonly DirectoryRecord[],
  input: DirectorySearchInput,
): DirectorySearchResult {
  const query = normalizeDirectoryQuery(input.query ?? "");
  const types = new Set<DirectoryRecordType>(input.types ?? []);
  const page = clampDirectoryPage(input.page);
  const pageSize = clampDirectoryPageSize(input.pageSize);
  const candidates = fixture
    .filter((record) => types.size === 0 || types.has(record.entity_type))
    .filter((record) => {
      if (!query) return true;
      return [
        record.display_name_en,
        record.display_name_ar,
        record.primary_number,
        record.secondary_number,
      ].some((value) => normalizeDirectoryQuery(value ?? "").includes(query));
    })
    .sort((a, b) => {
      const aExact = [a.primary_number, a.secondary_number].some(
        (value) => normalizeDirectoryQuery(value ?? "") === query,
      );
      const bExact = [b.primary_number, b.secondary_number].some(
        (value) => normalizeDirectoryQuery(value ?? "") === query,
      );
      if (aExact !== bExact) return aExact ? -1 : 1;
      return (a.display_name_en ?? a.display_name_ar ?? a.source_key).localeCompare(
        b.display_name_en ?? b.display_name_ar ?? b.source_key,
      );
    });
  const start = (page - 1) * pageSize;
  return {
    records: candidates.slice(start, start + pageSize),
    page,
    pageSize,
    total: candidates.length,
    totalPages: Math.ceil(candidates.length / pageSize),
    unavailable: false,
  };
}

export function unavailableDirectoryResult(input: DirectorySearchInput): DirectorySearchResult {
  const page = clampDirectoryPage(input.page);
  const pageSize = clampDirectoryPageSize(input.pageSize);
  return { records: [], page, pageSize, total: 0, totalPages: 0, unavailable: true };
}

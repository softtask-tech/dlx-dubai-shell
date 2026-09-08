import { z } from "zod";

import { directoryKeyFromSlug } from "./directory-contract";
import { getDirectoryRecordFn, searchDirectoryFn } from "./directory.functions";
import { DIRECTORY_RECORD_TYPES, type DirectoryRecordType } from "./directory-types";
import { datasetSchema } from "@/lib/schema";

export const directorySearchSchema = z.object({
  q: z.string().max(160).catch("").default(""),
  type: z.enum(DIRECTORY_RECORD_TYPES).optional().catch(undefined),
  page: z.coerce.number().int().positive().max(10000).catch(1).default(1),
});

export type DirectoryRouteSearch = z.infer<typeof directorySearchSchema>;

export async function loadDirectoryList(
  search: DirectoryRouteSearch,
  forcedType?: DirectoryRecordType,
) {
  return searchDirectoryFn({
    data: {
      query: search.q,
      types: forcedType ? [forcedType] : search.type ? [search.type] : undefined,
      page: search.page,
      pageSize: 24,
    },
  });
}

export async function loadDirectoryDetail(
  entityType: DirectoryRecordType,
  keyOrSlug: string,
  slug = false,
) {
  return getDirectoryRecordFn({
    data: {
      entityType,
      sourceKey: slug ? directoryKeyFromSlug(keyOrSlug) : decodeURIComponent(keyOrSlug),
    },
  });
}

/**
 * Registered sale activity for one official record, matched on its public
 * number and nothing else. A record with no official number, or one the
 * published aggregates do not cover, simply gets no module.
 */
export async function loadRecordedActivity(
  entityType: "project" | "developer",
  primaryNumber: string | null,
) {
  const { getMarketEntitySeriesFn, getMarketMetadataFn } =
    await import("./market-public.functions");
  if (!primaryNumber || !/^[0-9]{1,12}$/.test(primaryNumber)) {
    return { rows: [], sourceExportDate: null };
  }
  const [metadata, rows] = await Promise.all([
    getMarketMetadataFn(),
    getMarketEntitySeriesFn({
      data: {
        entityType,
        entityId: primaryNumber,
        metric: "registered_sale_count",
        grain: "year",
        from: "2015-01-01",
        to: "2026-12-31",
        limit: 20,
      },
    }),
  ]);
  return {
    rows: rows.filter((row) => row.segment_code === "all"),
    sourceExportDate: metadata.sourceExportDate,
  };
}

/**
 * Dataset schema for a directory page.
 *
 * These pages republish a public register, which is the single most
 * schema-worthy thing on the site and had none of it. An answer engine asked
 * "is this broker registered in Dubai" has no way to know this page can answer
 * that unless the page says so in a form it reads.
 *
 * It describes the register, not the current page of results. A search view is
 * a query over the same dataset however it is filtered or paged, and emitting a
 * different Dataset per query would claim a dataset per query exists.
 *
 * Returns an empty list when no export date is known, because `dateModified` is
 * the one field here that must not be guessed: a stale register presented as
 * current is worse than one that declines to say.
 */
export function directoryDatasetSchema(input: {
  name: string;
  description: string;
  path: string;
  exportDate: string | null | undefined;
}) {
  if (!input.exportDate) return [];
  return [
    datasetSchema({
      name: input.name,
      description: input.description,
      path: input.path,
      /* Always official: every row here is a Dubai Land Department record and
       * nothing on these pages is derived or estimated. */
      isOfficial: true,
      dateModified: input.exportDate,
      spatialCoverage: "Dubai, United Arab Emirates",
    }),
  ];
}

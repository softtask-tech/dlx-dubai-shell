import { z } from "zod";

import { directoryKeyFromSlug } from "./directory-contract";
import { getDirectoryRecordFn, searchDirectoryFn } from "./directory.functions";
import { DIRECTORY_RECORD_TYPES, type DirectoryRecordType } from "./directory-types";

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

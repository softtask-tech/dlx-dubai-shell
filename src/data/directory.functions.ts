import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DIRECTORY_RECORD_TYPES } from "./directory-types";

const recordType = z.enum(DIRECTORY_RECORD_TYPES);
const searchInput = z.object({
  query: z.string().max(160).optional(),
  types: z.array(recordType).max(DIRECTORY_RECORD_TYPES.length).optional(),
  page: z.number().int().positive().max(10000).optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

export const searchDirectoryFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchInput.parse(input))
  .handler(async ({ data }) => {
    const { searchDirectoryServer } = await import("./directory.server");
    return searchDirectoryServer(data);
  });

export const getDirectoryRecordFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ entityType: recordType, sourceKey: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getDirectoryRecordServer } = await import("./directory.server");
    return getDirectoryRecordServer(data.entityType, data.sourceKey);
  });

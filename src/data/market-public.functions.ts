/**
 * Client-safe entry points to the published DLD market aggregates.
 *
 * Routes call these; only the handlers reach `market-public.server.ts`, so the
 * Supabase access never enters a browser bundle. Every input is bounded here as
 * well as in the database function, because the public RPCs are reachable
 * anonymously and a bound stated in two places is a bound that holds.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MARKET_METRICS, MAX_COMPARE_COMMUNITIES } from "./market-public";

const metric = z.enum(MARKET_METRICS);
const grain = z.enum(["month", "quarter", "year"]);
const entityType = z.enum(["dubai", "community", "project", "developer"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const entityId = z.string().regex(/^[0-9]{1,12}$/);

export const getMarketMetadataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getMarketMetadata } = await import("./market-public.server");
  return getMarketMetadata();
});

export const getMarketOverviewFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        metrics: z.array(metric).min(1).max(10),
        grain,
        from: isoDate,
        to: isoDate,
        limit: z.number().int().positive().max(2000).default(900),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getMarketOverview } = await import("./market-public.server");
    return getMarketOverview(data);
  });

export const getMarketEntitySeriesFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        entityType,
        entityId,
        metric,
        grain,
        from: isoDate,
        to: isoDate,
        limit: z.number().int().positive().max(200).default(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getMarketEntitySeries } = await import("./market-public.server");
    return getMarketEntitySeries(data);
  });

export const compareMarketCommunitiesFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        communityIds: z.array(entityId).min(1).max(MAX_COMPARE_COMMUNITIES),
        metric,
        grain,
        period: isoDate,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { compareMarketCommunities } = await import("./market-public.server");
    return compareMarketCommunities(data);
  });

export const searchMarketEntitiesFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        query: z.string().max(100),
        types: z.array(entityType).min(1).max(4).default(["community", "project", "developer"]),
        limit: z.number().int().positive().max(50).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { searchMarketEntities } = await import("./market-public.server");
    return searchMarketEntities(data);
  });

/** Server-only access to public DLD directory surfaces. Never query canonical/internal tables here. */
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  clampDirectoryPage,
  clampDirectoryPageSize,
  unavailableDirectoryResult,
} from "./directory-contract";
import type {
  DirectoryRecord,
  DirectorySearchInput,
  DirectorySearchResult,
} from "./directory-types";

type ReadOnlyView<Row> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: [];
};

type DirectoryDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: { dld_directory_search_public: ReadOnlyView<DirectoryRecord> };
    Functions: {
      search_dld_directory: {
        Args: {
          search_query?: string;
          entity_types?: string[] | null;
          page_number?: number;
          page_size?: number;
        };
        Returns: DirectoryRecord[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const directoryDb = supabase as unknown as SupabaseClient<DirectoryDatabase>;

export async function searchDirectoryServer(
  input: DirectorySearchInput,
): Promise<DirectorySearchResult> {
  const page = clampDirectoryPage(input.page);
  const pageSize = clampDirectoryPageSize(input.pageSize);
  try {
    const { data, error } = await directoryDb.rpc("search_dld_directory", {
      search_query: input.query?.trim() ?? "",
      entity_types: input.types?.length ? input.types : null,
      page_number: page,
      page_size: pageSize,
    });
    if (error) throw error;
    const records = (data ?? []).map((record) => ({
      ...record,
      total_count: Number(record.total_count ?? 0),
      related_context: record.related_context ?? {},
    }));
    const total = Number(records[0]?.total_count ?? 0);
    return {
      records,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      unavailable: false,
    };
  } catch (error) {
    console.error("[data:dld-directory-search] public directory unavailable", error);
    return unavailableDirectoryResult({ ...input, page, pageSize });
  }
}

export async function getDirectoryRecordServer(
  entityType: DirectoryRecord["entity_type"],
  sourceKey: string,
): Promise<{ record: DirectoryRecord | null; unavailable: boolean }> {
  try {
    const { data, error } = await directoryDb
      .from("dld_directory_search_public")
      .select("*")
      .eq("entity_type", entityType)
      .eq("source_key", sourceKey)
      .maybeSingle<DirectoryRecord>();
    if (error) throw error;
    return {
      record: data ? { ...data, related_context: data.related_context ?? {} } : null,
      unavailable: false,
    };
  } catch (error) {
    console.error(`[data:dld-directory-${entityType}] public detail unavailable`, error);
    return { record: null, unavailable: true };
  }
}

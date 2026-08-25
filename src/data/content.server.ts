/**
 * Content CRUD for the admin editor, server side only.
 *
 * One generic path rather than six near-identical modules: the tables differ
 * in their columns, not in how they are edited. What keeps that safe is the
 * field schema below, only the columns named there can be written, so a
 * crafted request cannot set `is_published` on a table that has no such
 * concept, or write to a column the editor never shows.
 */
import { CONTENT_SCHEMA, type ContentTable, type FieldSpec } from "./content-schema";
import { adminDb } from "./database.server";
import type { JsonObject } from "./types";

export { CONTENT_SCHEMA };
export type { ContentTable, FieldSpec };

/** Every row, drafts included, the editor needs to see what the public cannot. */
export async function listContent(table: ContentTable): Promise<JsonObject[]> {
  const supabase = await adminDb();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<JsonObject[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Coerces one submitted value to what the column expects.
 * An empty string becomes null rather than "", so an unfilled optional field
 * does not turn into an empty string in the database.
 */
function coerce(field: FieldSpec, raw: unknown): unknown {
  if (field.kind === "boolean") return Boolean(raw);
  if (field.kind === "list") {
    if (Array.isArray(raw)) return raw;
    const text = String(raw ?? "").trim();
    return text.length === 0
      ? []
      : text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
  }
  if (raw === "" || raw === null || raw === undefined) return null;
  if (field.kind === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return String(raw);
}

/**
 * Writes a row through the field allow-list.
 * Anything not named in CONTENT_SCHEMA is dropped, whatever the client sent.
 */
export async function saveContent(
  table: ContentTable,
  values: Record<string, unknown>,
  id?: string,
): Promise<{ id: string }> {
  const supabase = await adminDb();
  const { fields } = CONTENT_SCHEMA[table];

  const row: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field.name in values)) continue;
    row[field.name] = coerce(field, values[field.name]);
  }

  for (const field of fields) {
    if (field.required && (row[field.name] === null || row[field.name] === undefined)) {
      throw new Error(`${field.label} is required.`);
    }
  }

  /* Stamp the publish date the first time something goes live, but never over
   * a date the editor set themselves, which the journal relies on. */
  if (row["is_published"] === true && (row["published_at"] ?? null) === null) {
    row["published_at"] = new Date().toISOString();
  }

  /*
   * The cast is the price of one generic editor for six tables: `row` was
   * built column by column from CONTENT_SCHEMA, so at runtime it only ever
   * contains columns that exist on `table`, but TypeScript cannot narrow a
   * union of six row shapes from a runtime string. The allow-list above is
   * what actually keeps this safe; widen it and this becomes unsafe.
   */
  const writable = row as never;

  if (id) {
    const { error } = await supabase.from(table).update(writable).eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  }

  const { data, error } = await supabase
    .from(table)
    .insert(writable)
    .select("id")
    .single<{ id: string }>();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function deleteContent(table: ContentTable, id: string): Promise<void> {
  const supabase = await adminDb();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

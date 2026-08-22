import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useAdminSession } from "./route";
import { deleteContentFn, listContentFn, saveContentFn } from "@/data/admin.functions";
import {
  CONTENT_SCHEMA,
  CONTENT_TABLES,
  type ContentTable,
  type FieldKind,
  type FieldSpec,
} from "@/data/content-schema";
import type { JsonObject } from "@/data/types";
import { pageHead } from "@/lib/seo";
import { Field, Select, TextArea, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * Content management.
 *
 * One editor for six tables, driven by CONTENT_SCHEMA — the same definition
 * the server writes through. Adding a column to the editor is a one-line change
 * in that file, and there is no way to render a field the server would reject
 * or to submit one it would not have shown.
 */
export const Route = createFileRoute("/admin/content")({
  head: () =>
    pageHead({
      path: "/admin/content",
      title: "Content",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: ContentManager,
});

function ContentManager() {
  const session = useAdminSession();
  const [table, setTable] = useState<ContentTable>("properties");
  const [rows, setRows] = useState<JsonObject[]>([]);
  const [editing, setEditing] = useState<JsonObject | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listContentFn({ data: { accessToken: session.accessToken, table } });
      setRows(result.rows);
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load that. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, table]);

  useEffect(() => {
    void load();
  }, [load]);

  const schema = CONTENT_SCHEMA[table];
  const columns = schema.fields.filter((field) => field.inList);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this permanently? This cannot be undone.")) return;
    await deleteContentFn({ data: { accessToken: session.accessToken, table, id } });
    await load();
  }

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Content</Eyebrow>
          <h1 className="display-2 mt-4">{schema.label}</h1>
        </div>
        <Button onClick={() => setEditing("new")}>Add new</Button>
      </div>

      <nav
        aria-label="Content type"
        className="mt-10 flex flex-wrap gap-6 border-y border-border py-5"
      >
        {CONTENT_TABLES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setTable(name);
              setEditing(null);
            }}
            className={
              name === table
                ? "eyebrow text-foreground underline decoration-accent underline-offset-4"
                : "eyebrow text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {CONTENT_SCHEMA[name].label}
          </button>
        ))}
      </nav>

      {error ? (
        <p role="alert" className="caption mt-8 text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="eyebrow mt-12">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="body-text mt-12 text-muted-foreground">
          Nothing here yet. Add the first one.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th key={column.name} className="eyebrow py-4 pr-6 text-left font-normal">
                    {column.label}
                  </th>
                ))}
                <th className="py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row["id"])} className="border-b border-border/60 align-top">
                  {columns.map((column) => (
                    <td key={column.name} className="body-text py-5 pr-6">
                      {renderCell(column, row[column.name])}
                    </td>
                  ))}
                  <td className="py-5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="eyebrow link-underline text-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(String(row["id"]))}
                      className="eyebrow link-underline ml-6 text-muted-foreground"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <ContentForm
          table={table}
          fields={schema.fields}
          row={editing === "new" ? null : editing}
          accessToken={session.accessToken}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </Container>
  );
}

function renderCell(field: FieldSpec, value: unknown) {
  if (field.kind === "boolean") {
    return value ? <Tag variant="soft">Yes</Tag> : <Tag variant="bare">No</Tag>;
  }
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  const text = String(value);
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function ContentForm({
  table,
  fields,
  row,
  accessToken,
  onClose,
  onSaved,
}: {
  table: ContentTable;
  fields: readonly FieldSpec[];
  row: JsonObject | null;
  accessToken: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(fields, row));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveContentFn({
        data: {
          accessToken,
          table,
          ...(row ? { id: String(row["id"]) } : {}),
          values,
        },
      });
      onSaved();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 cursor-default"
      />
      <form
        onSubmit={handleSubmit}
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="display-3">{row ? "Edit" : "Add new"}</h2>
          <button type="button" onClick={onClose} className="eyebrow link-underline">
            Close
          </button>
        </div>

        <div className="mt-10 flex flex-col gap-8">
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(next) => setValues((current) => ({ ...current, [field.name]: next }))}
            />
          ))}
        </div>

        {error ? (
          <p role="alert" className="caption mt-8 text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="mt-10" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}

function initialValues(fields: readonly FieldSpec[], row: JsonObject | null) {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = row?.[field.name];
    if (field.kind === "list") {
      values[field.name] = Array.isArray(raw) ? raw.join("\n") : "";
    } else if (field.kind === "boolean") {
      values[field.name] = Boolean(raw);
    } else {
      values[field.name] = raw ?? "";
    }
  }
  return values;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const common = { id: field.name, name: field.name };

  if (field.kind === "boolean") {
    return (
      <label className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-accent"
          {...common}
        />
        <span className="eyebrow">{field.label}</span>
      </label>
    );
  }

  return (
    <Field
      label={field.label}
      name={field.name}
      {...(field.help ? { hint: field.help } : {})}
      {...(field.required ? { required: true } : {})}
    >
      {field.kind === "textarea" || field.kind === "list" ? (
        <TextArea
          rows={field.kind === "list" ? 4 : 6}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          {...common}
        />
      ) : field.kind === "select" ? (
        <Select
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          {...common}
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      ) : (
        <TextInput
          type={inputTypeFor(field.kind)}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          {...common}
        />
      )}
    </Field>
  );
}

/** Maps a field kind to the input type that gives the editor the right keyboard. */
function inputTypeFor(kind: FieldKind): string {
  switch (kind) {
    case "number":
      return "number";
    case "url":
      return "url";
    case "date":
      return "date";
    default:
      return "text";
  }
}

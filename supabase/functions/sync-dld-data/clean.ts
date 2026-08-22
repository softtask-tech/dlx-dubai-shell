/**
 * Cleaning and validating Dubai Land Department rows.
 *
 * A direct port of `scripts/dld-clean.mjs`, kept in step with it deliberately:
 * the one-time import and the scheduled sync must accept and reject exactly the
 * same rows, or the dataset changes character depending on how it arrived.
 */

export const REJECTION_REASONS: Record<string, string> = {
  no_id: "no source identifier",
  no_date: "unparseable transaction date",
  no_amount: "missing or non-positive amount",
  no_area_name: "no community name",
  implausible_size: "size missing or implausible",
  implausible_ppsf: "price per square foot outside plausible range",
  future_date: "dated in the future",
};

type Record_ = Record<string, unknown>;

function firstOf(record: Record_, names: string[]): string | null {
  for (const name of names) {
    const value = record[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value.replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: string | null): string | null {
  if (!value) return null;
  const text = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(text);
  if (dmy) return `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

const MIN_SQM = 15;
const MAX_SQM = 20000;
const MIN_PPSF = 100;
const MAX_PPSF = 30000;

export function parseBedrooms(rooms: string | null): number | null {
  if (!rooms) return null;
  const text = rooms.toLowerCase();
  if (text.includes("studio")) return 0;
  const match = /(\d+)/.exec(text);
  if (!match) return null;
  const beds = Number(match[1]);
  return beds >= 0 && beds <= 20 ? beds : null;
}

function parseFreehold(value: string | null): boolean | null {
  if (value === null) return null;
  const text = value.toLowerCase();
  if (text.startsWith("free")) return true;
  if (text.startsWith("non") || text.startsWith("lease")) return false;
  return null;
}

export type CleanResult<T> = { ok: true; row: T } | { ok: false; reason: string };

export function cleanTransactionRow(record: Record_): CleanResult<Record_> {
  const sourceId = firstOf(record, [
    "transaction_id",
    "trans_id",
    "procedure_id",
    "transaction_number",
    "id",
  ]);
  if (!sourceId) return { ok: false, reason: "no_id" };

  const date = toDate(
    firstOf(record, ["instance_date", "transaction_date", "date", "procedure_date"]),
  );
  if (!date) return { ok: false, reason: "no_date" };
  if (date > new Date().toISOString().slice(0, 10)) return { ok: false, reason: "future_date" };

  const amount = toNumber(
    firstOf(record, ["actual_worth", "trans_value", "amount", "procedure_value"]),
  );
  if (!amount || amount <= 0) return { ok: false, reason: "no_amount" };

  const areaName = firstOf(record, [
    "area_name_en",
    "area_name",
    "master_project_en",
    "nearest_landmark_en",
  ]);
  if (!areaName) return { ok: false, reason: "no_area_name" };

  const sqm = toNumber(
    firstOf(record, ["procedure_area", "actual_area", "area", "property_size_sqm"]),
  );
  if (!sqm || sqm < MIN_SQM || sqm > MAX_SQM) return { ok: false, reason: "implausible_size" };

  const ppsf = amount / (sqm * 10.7639104);
  if (ppsf < MIN_PPSF || ppsf > MAX_PPSF) return { ok: false, reason: "implausible_ppsf" };

  const rooms = firstOf(record, ["rooms_en", "rooms", "room_description"]);

  return {
    ok: true,
    row: {
      provenance: "dld_open_data",
      source_transaction_id: sourceId,
      transaction_date: date,
      transaction_group: firstOf(record, ["group_en", "trans_group_en", "transaction_group"]),
      registration_type: firstOf(record, ["reg_type_en", "registration_type", "is_offplan_en"]),
      property_type: firstOf(record, ["property_type_en", "property_type"]),
      property_subtype: firstOf(record, ["property_sub_type_en", "property_subtype"]),
      area_name_raw: areaName,
      building_name: firstOf(record, ["building_name_en", "building_name", "project_en"]),
      rooms_raw: rooms,
      bedrooms: parseBedrooms(rooms),
      amount,
      area_sqm: sqm,
      is_freehold: parseFreehold(firstOf(record, ["is_free_hold_en", "is_freehold"])),
    },
  };
}

export function cleanRentRow(record: Record_): CleanResult<Record_> {
  const sourceId = firstOf(record, ["contract_id", "ejari_contract_number", "id"]);
  if (!sourceId) return { ok: false, reason: "no_id" };

  const start = toDate(firstOf(record, ["contract_start_date", "start_date", "registration_date"]));
  if (!start) return { ok: false, reason: "no_date" };

  const areaName = firstOf(record, ["area_name_en", "area_name", "master_project_en"]);
  if (!areaName) return { ok: false, reason: "no_area_name" };

  const amount = toNumber(firstOf(record, ["annual_amount", "contract_amount", "amount"]));
  if (!amount || amount <= 0) return { ok: false, reason: "no_amount" };

  const end = toDate(firstOf(record, ["contract_end_date", "end_date"]));
  let annual = amount;
  if (end && firstOf(record, ["contract_amount"]) && !firstOf(record, ["annual_amount"])) {
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
    if (days > 30 && days < 3650) annual = (amount / days) * 365;
  }

  const sqm = toNumber(firstOf(record, ["actual_area", "property_size_sqm", "area"]));
  const rooms = firstOf(record, ["rooms", "ejari_property_type_en"]);

  return {
    ok: true,
    row: {
      provenance: "dld_open_data",
      source_contract_id: sourceId,
      contract_start_date: start,
      area_name_raw: areaName,
      property_type: firstOf(record, ["property_type_en", "ejari_property_type_en"]),
      bedrooms: parseBedrooms(rooms),
      annual_rent: Math.round(annual),
      area_sqm: sqm && sqm >= MIN_SQM && sqm <= MAX_SQM ? sqm : null,
    },
  };
}

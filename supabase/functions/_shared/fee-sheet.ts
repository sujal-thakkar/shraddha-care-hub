// Mirrors confirmed fee payments into the "Fee Payments" tab of the team Google Sheet.
// Never throws: the ledger in the database always stays the source of truth.
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

const SPREADSHEET_ID = "1OeHRRTQw-oosoRJKxWgUOs4Kb4DcQy8cjFT0-oLOz_o";
const SHEET = "Fee Payments";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const HEADER = [
  "Entry ID", "Date", "Membership ID", "Member", "Phone", "Amount (Rs)", "Monthly fee (Rs)",
  "Months covered", "Paid up to", "Credit used (Rs)", "Advance credit (Rs)",
  "Source", "State", "Collected by", "Approved on", "Settled", "Receipt SMS",
];

type Row = (string | number)[];

function keys() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const sheetsKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
  if (!lovableKey || !sheetsKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
}

async function sheetsFetch(path: string, init: RequestInit & { headers: HeadersInit }) {
  const res = await fetch(`${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

/** Makes sure the tab exists and its header row is written. */
async function ensureSheet(headers: HeadersInit) {
  const meta = await sheetsFetch("", { method: "GET", headers });
  const exists = (meta.sheets ?? []).some((s: any) => s.properties?.title === SHEET);
  if (!exists) {
    await sheetsFetch(":batchUpdate", {
      method: "POST",
      headers,
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET } } }] }),
    });
  }
  await sheetsFetch(`/values/${SHEET}!A1:Q1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ values: [HEADER] }),
  });
}

function toRow(tx: any, profile: any, sms: string): Row {
  return [
    tx.id,
    (tx.paid_on ?? tx.created_at ?? "").slice(0, 10),
    tx.membership_id ?? profile?.membership_id ?? "",
    profile?.full_name ?? "",
    (profile?.phone_e164 ?? "").replace("+91", ""),
    tx.amount_inr ?? 0,
    tx.monthly_fee_amount ?? "",
    tx.months_covered ?? 0,
    tx.period_end ?? "",
    tx.credit_used_inr ?? 0,
    tx.advance_credit_inr ?? 0,
    tx.source ?? "",
    tx.state ?? "",
    tx.receiver_name ?? "",
    (tx.approved_at ?? "").slice(0, 10),
    tx.settled ? "yes" : "no",
    sms,
  ];
}

/**
 * Writes the given entries (or every confirmed entry when ids is null) to the sheet.
 * Existing rows are matched on the entry ID so a re-sync repairs instead of duplicating.
 */
export async function syncTransactionsToSheet(
  svc: SupabaseClient,
  ids: string[] | null,
): Promise<{ ok: boolean; synced: number; error?: string }> {
  try {
    const headers = keys();
    if (!headers) return { ok: false, synced: 0, error: "Google Sheets is not connected yet." };

    let query = svc.from("membership_transactions").select("*").order("created_at", { ascending: true });
    query = ids ? query.in("id", ids) : query.eq("state", "success");
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    if (!rows?.length) return { ok: true, synced: 0 };

    const userIds = [...new Set(rows.map((r: any) => r.member_user_id).filter(Boolean))];
    const [{ data: profiles }, { data: smsRows }] = await Promise.all([
      svc.from("profiles").select("user_id, full_name, membership_id, phone_e164").in("user_id", userIds),
      svc.from("sms_log").select("transaction_id, status").in("transaction_id", rows.map((r: any) => r.id)),
    ]);
    const byUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const bySms = new Map((smsRows ?? []).map((s: any) => [s.transaction_id, s.status]));

    await ensureSheet(headers);

    // Existing entry ids, so we update in place rather than appending twice.
    const existing = await sheetsFetch(`/values/${SHEET}!A2:A100000`, { method: "GET", headers });
    const index = new Map<string, number>();
    ((existing.values ?? []) as string[][]).forEach((r, i) => { if (r[0]) index.set(r[0], i + 2); });

    const appends: Row[] = [];
    const updates: { range: string; values: Row[] }[] = [];
    for (const tx of rows as any[]) {
      const row = toRow(tx, byUser.get(tx.member_user_id), bySms.get(tx.id) ?? "not sent");
      const at = index.get(tx.id);
      if (at) updates.push({ range: `${SHEET}!A${at}:Q${at}`, values: [row] });
      else appends.push(row);
    }

    if (updates.length) {
      await sheetsFetch("/values:batchUpdate", {
        method: "POST",
        headers,
        body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
      });
    }
    if (appends.length) {
      await sheetsFetch(`/values/${SHEET}!A1:Q1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers,
        body: JSON.stringify({ values: appends }),
      });
    }
    return { ok: true, synced: rows.length };
  } catch (e) {
    console.error("fee sheet sync failed", (e as Error).message);
    return { ok: false, synced: 0, error: (e as Error).message };
  }
}

/**
 * Removes the given entry ids from the sheet so a deleted test entry disappears
 * there too. Matches on the entry ID in column A; never throws.
 */
export async function deleteRowsFromSheet(ids: string[]): Promise<{ ok: boolean; removed: number; error?: string }> {
  try {
    if (!ids.length) return { ok: true, removed: 0 };
    const headers = keys();
    if (!headers) return { ok: false, removed: 0, error: "Google Sheets is not connected yet." };

    const meta = await sheetsFetch("", { method: "GET", headers });
    const sheet = (meta.sheets ?? []).find((s: any) => s.properties?.title === SHEET);
    if (!sheet) return { ok: true, removed: 0 };
    const sheetId = sheet.properties.sheetId;

    const existing = await sheetsFetch(`/values/${SHEET}!A2:A100000`, { method: "GET", headers });
    const wanted = new Set(ids);
    const rowIndexes: number[] = [];
    ((existing.values ?? []) as string[][]).forEach((r, i) => {
      if (r[0] && wanted.has(r[0])) rowIndexes.push(i + 1); // 0-based grid index, +1 skips the header
    });
    if (!rowIndexes.length) return { ok: true, removed: 0 };

    // Delete bottom-up so earlier deletions do not shift later indexes.
    const requests = rowIndexes.sort((a, b) => b - a).map((idx) => ({
      deleteDimension: {
        range: { sheetId, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 },
      },
    }));
    await sheetsFetch(":batchUpdate", { method: "POST", headers, body: JSON.stringify({ requests }) });
    return { ok: true, removed: rowIndexes.length };
  } catch (e) {
    console.error("fee sheet delete failed", (e as Error).message);
    return { ok: false, removed: 0, error: (e as Error).message };
  }
}

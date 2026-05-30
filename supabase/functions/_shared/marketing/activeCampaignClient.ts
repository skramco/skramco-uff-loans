/** ActiveCampaign REST API v3 client — marketing sends only. */

export interface ACList {
  id: string;
  name: string;
  stringid?: string;
}

export interface ACMessageResult {
  messageId: string;
  raw: unknown;
}

export interface ACCampaignResult {
  campaignId: string;
  raw: unknown;
}

export interface ACReportMetrics {
  sends: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
  spamComplaints: number;
  raw: unknown;
}

/** Ensure REST v3 base URL — AC returns HTML 404 without `/api/3`. */
export function normalizeActiveCampaignApiUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");

  // e.g. https://uffmortgage.activehosted.com → https://uffmortgage.api-us1.com
  const hosted = url.match(/^https?:\/\/([^.]+)\.activehosted\.com/i);
  if (hosted) {
    url = `https://${hosted[1]}.api-us1.com`;
  }

  if (!/\/api\/3$/i.test(url)) {
    url = /\/api$/i.test(url) ? `${url}/3` : `${url}/api/3`;
  }

  return url;
}

function getConfig() {
  const apiUrlRaw = Deno.env.get("ACTIVECAMPAIGN_API_URL");
  const apiKey = Deno.env.get("ACTIVECAMPAIGN_API_KEY");
  if (!apiUrlRaw || !apiKey) {
    throw new Error("ACTIVECAMPAIGN_API_URL and ACTIVECAMPAIGN_API_KEY must be configured");
  }
  return { apiUrl: normalizeActiveCampaignApiUrl(apiUrlRaw), apiKey };
}

async function acFetch(
  path: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  const { apiUrl, apiKey } = getConfig();
  const url = `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Api-Token": apiKey,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });

    if (response.status === 429 && attempt < retries) {
      const delay = Math.pow(2, attempt + 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return response;
  }

  throw new Error("ActiveCampaign rate limit exceeded after retries");
}

function redactForLog(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  const copy = { ...(obj as Record<string, unknown>) };
  for (const k of Object.keys(copy)) {
    if (/token|key|secret|password/i.test(k)) copy[k] = "[REDACTED]";
  }
  return copy;
}

export async function listLists(): Promise<ACList[]> {
  const response = await acFetch("/lists?limit=100");
  if (!response.ok) {
    const text = await response.text();
    const hint = text.includes("<html") || text.includes("Not Found")
      ? " Check ACTIVECAMPAIGN_API_URL — it must end with /api/3 (e.g. https://uffmortgage.api-us1.com/api/3)."
      : "";
    throw new Error(`AC listLists failed: ${response.status} ${text.slice(0, 200)}${hint}`);
  }
  const data = await response.json();
  return (data.lists ?? []).map((l: { id: string; name: string; stringid?: string }) => ({
    id: String(l.id),
    name: l.name,
    stringid: l.stringid,
  }));
}

export async function getList(id: string): Promise<ACList | null> {
  const response = await acFetch(`/lists/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AC getList failed: ${response.status} ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  const l = data.list;
  return l ? { id: String(l.id), name: l.name, stringid: l.stringid } : null;
}

function getAccountBaseUrl(): string {
  const { apiUrl } = getConfig();
  return apiUrl.replace(/\/api\/3$/i, "");
}

function getActiveCampaignTimezone(): string {
  return Deno.env.get("ACTIVECAMPAIGN_TIMEZONE") || "America/Los_Angeles";
}

let cachedAcTimezone: string | null = null;

/** Prefer ACTIVECAMPAIGN_TIMEZONE env, else AC user localZoneid (UFF account is Pacific). */
export async function resolveActiveCampaignTimezone(): Promise<string> {
  const fromEnv = Deno.env.get("ACTIVECAMPAIGN_TIMEZONE");
  if (fromEnv) return fromEnv;
  if (cachedAcTimezone) return cachedAcTimezone;

  try {
    const response = await acFetch("/users?limit=1");
    if (response.ok) {
      const data = await response.json();
      const zone = data.users?.[0]?.localZoneid;
      if (typeof zone === "string" && zone.trim()) {
        cachedAcTimezone = zone.trim();
        return cachedAcTimezone;
      }
    }
  } catch {
    /* use default */
  }

  cachedAcTimezone = getActiveCampaignTimezone();
  return cachedAcTimezone;
}

/** AC sdate must be account-local wall time (YYYY-MM-DD HH:MM:SS), not UTC. */
export function formatAcDateTime(d: Date, timezone = getActiveCampaignTimezone()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  let hour = get("hour");
  if (hour === "24") hour = "00";

  return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}:${get("second")}`;
}

/** Legacy v1 API — required for campaign create/send (v3 POST /campaigns returns 405). */
async function acV1Post(
  action: string,
  params: Record<string, string | number>
): Promise<Record<string, unknown>> {
  const { apiKey } = getConfig();
  const base = getAccountBaseUrl();
  const query = new URLSearchParams({
    api_action: action,
    api_output: "json",
  });
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, String(value));
  }

  const response = await fetch(`${base}/admin/api.php?${query}`, {
    method: "POST",
    headers: {
      "Api-Token": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`AC ${action} failed: unexpected response ${text.slice(0, 200)}`);
  }

  const resultCode = data.result_code;
  if (!response.ok || resultCode === 0 || resultCode === "0") {
    throw new Error(
      `AC ${action} failed: ${String(data.result_message ?? response.status)} ${JSON.stringify(redactForLog(data))}`
    );
  }

  return data;
}

export async function createMessage(opts: {
  subject: string;
  html: string;
  text?: string;
  preheader?: string;
}): Promise<ACMessageResult> {
  const fromEmail = Deno.env.get("ACTIVECAMPAIGN_FROM_EMAIL") || "noreply@uff.loans";
  const fromName = Deno.env.get("ACTIVECAMPAIGN_FROM_NAME") || "United Fidelity Funding";
  const replyTo = Deno.env.get("ACTIVECAMPAIGN_REPLY_TO") || fromEmail;

  const body = {
    message: {
      name: `UFF ${opts.subject.slice(0, 40)} ${Date.now()}`,
      fromemail: fromEmail,
      fromname: fromName,
      reply2: replyTo,
      subject: opts.subject,
      preheader_text: opts.preheader ?? "",
      html: opts.html,
      text: opts.text ?? opts.html.replace(/<[^>]+>/g, " "),
    },
  };

  const response = await acFetch("/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `AC createMessage failed: ${response.status} ${JSON.stringify(redactForLog(data))}`
    );
  }

  return {
    messageId: String(data.message?.id ?? data.id),
    raw: redactForLog(data),
  };
}

export async function createCampaign(opts: {
  name: string;
  messageId: string;
  listIds: string[];
  /** When set (and not draft), AC schedules/sends at this time. Defaults to now. */
  sendAt?: Date;
  /** Draft campaigns are created in AC but not scheduled. */
  draft?: boolean;
  /** When true, nudge send time 1 min back so AC treats it as send-now (not future). */
  sendNow?: boolean;
}): Promise<ACCampaignResult> {
  let sendAt = opts.sendAt ?? new Date();
  if (!opts.draft && (opts.sendNow || !opts.sendAt)) {
    sendAt = new Date(sendAt.getTime() - 60_000);
  }
  const timezone = await resolveActiveCampaignTimezone();
  const params: Record<string, string | number> = {
    type: "single",
    segmentid: 0,
    name: opts.name,
    public: 1,
    tracklinks: "all",
    trackreads: 1,
    trackreplies: 1,
    htmlunsub: 1,
    textunsub: 1,
    status: opts.draft ? 0 : 1,
    sdate: formatAcDateTime(sendAt, timezone),
  };

  for (const listId of opts.listIds) {
    params[`p[${listId}]`] = listId;
  }
  params[`m[${opts.messageId}]`] = 100;

  const data = await acV1Post("campaign_create", params);

  return {
    campaignId: String(data.id),
    raw: redactForLog(data),
  };
}

export async function scheduleCampaign(
  campaignId: string,
  sendAt: Date
): Promise<unknown> {
  const timezone = await resolveActiveCampaignTimezone();
  const data = await acV1Post("campaign_status", {
    id: campaignId,
    status: 1,
    sdate: formatAcDateTime(sendAt, timezone),
  });
  return redactForLog(data);
}

export async function sendCampaignNow(campaignId: string): Promise<unknown> {
  return scheduleCampaign(campaignId, new Date());
}

export async function getCampaignReport(campaignId: string): Promise<ACReportMetrics> {
  const response = await acFetch(`/campaigns/${campaignId}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AC getCampaignReport failed: ${response.status} ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  const c = data.campaign ?? data;

  return {
    sends: parseInt(String(c.send_amt ?? c.sent ?? 0), 10) || 0,
    opens: parseInt(String(c.uniqueopens ?? c.opens ?? 0), 10) || 0,
    clicks: parseInt(String(c.uniquelinks ?? c.clicks ?? 0), 10) || 0,
    unsubscribes: parseInt(String(c.unsubscribes ?? 0), 10) || 0,
    bounces: parseInt(String(c.bounces ?? 0), 10) || 0,
    spamComplaints: parseInt(String(c.forwards ?? 0), 10) || 0,
    raw: redactForLog(data),
  };
}

/** Normalize list IDs from settings JSON, numbers, or env strings. */
export function parseListId(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string" || typeof parsed === "number") {
          return String(parsed);
        }
      } catch {
        /* use raw trimmed value */
      }
    }
    return trimmed;
  }
  return undefined;
}

export function getEnvDefaultListId(): string | undefined {
  return parseListId(Deno.env.get("ACTIVECAMPAIGN_DEFAULT_LIST_ID"));
}

/** Env-only fallback — prefer resolveDefaultListId when a settings repo is available. */
export function getDefaultListId(): string | undefined {
  return getEnvDefaultListId();
}

/** Admin settings override the ACTIVECAMPAIGN_DEFAULT_LIST_ID env var. */
export async function resolveDefaultListId(
  getSetting?: (key: string) => Promise<unknown>
): Promise<string | undefined> {
  if (getSetting) {
    const fromSettings = parseListId(await getSetting("activecampaign_default_list_id"));
    if (fromSettings) return fromSettings;
  }
  return getEnvDefaultListId();
}

/** At send time, admin settings win over list stamped at generation (unless overridden). */
export async function resolveSendListId(
  campaign: { activecampaign_list_id: string | null; metadata?: Record<string, unknown> },
  getSetting: (key: string) => Promise<unknown>
): Promise<string | undefined> {
  const meta = (campaign.metadata ?? {}) as Record<string, unknown>;
  if (meta.list_id_override === true && campaign.activecampaign_list_id) {
    return parseListId(campaign.activecampaign_list_id);
  }
  return (await resolveDefaultListId(getSetting)) ?? parseListId(campaign.activecampaign_list_id);
}

export { redactForLog as redactAcResponse };

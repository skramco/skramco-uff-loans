/** Canva Connect API client with OAuth token refresh. */

import { injectImageIntoHtml as injectUffHeroImage } from "./uffEmailTemplate.ts";

export interface CanvaTokens {
  access_token: string;
  refresh_token: string;
  expires_at?: string;
}

export interface CanvaExportResult {
  designId: string;
  exportUrl: string;
  raw: unknown;
}

function getOAuthConfig() {
  return {
    clientId: Deno.env.get("CANVA_CLIENT_ID") || "",
    clientSecret: Deno.env.get("CANVA_CLIENT_SECRET") || "",
    redirectUri: Deno.env.get("CANVA_REDIRECT_URI") || "",
  };
}

export async function loadTokensFromSettings(
  getSetting: (key: string) => Promise<unknown>
): Promise<CanvaTokens | null> {
  const stored = (await getSetting("canva_oauth_tokens")) as CanvaTokens | null;
  if (stored?.access_token) return stored;

  const access = Deno.env.get("CANVA_ACCESS_TOKEN");
  const refresh = Deno.env.get("CANVA_REFRESH_TOKEN");
  if (access && refresh) {
    return { access_token: access, refresh_token: refresh };
  }
  return null;
}

export async function refreshCanvaToken(
  refreshToken: string,
  saveTokens: (tokens: CanvaTokens) => Promise<void>
): Promise<string> {
  const { clientId, clientSecret } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error("CANVA_CLIENT_ID and CANVA_CLIENT_SECRET required for token refresh");
  }

  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Canva token refresh failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const tokens: CanvaTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined,
  };
  await saveTokens(tokens);
  return tokens.access_token;
}

async function canvaFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://api.canva.com/rest/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
}

export async function exchangeCanvaCode(
  code: string,
  saveTokens: (tokens: CanvaTokens) => Promise<void>
): Promise<CanvaTokens> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Canva OAuth exchange failed: ${response.status}`);
  }

  const data = await response.json();
  const tokens: CanvaTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined,
  };
  await saveTokens(tokens);
  return tokens;
}

export async function listBrandTemplates(accessToken: string): Promise<unknown[]> {
  const response = await canvaFetch("/brand-templates", accessToken);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Canva listBrandTemplates failed: ${response.status}`);
  }
  const data = await response.json();
  return data.items ?? data.brand_templates ?? [];
}

export async function createDesignFromTemplate(
  accessToken: string,
  templateId: string,
  autofillData: Record<string, string>
): Promise<{ designId: string; raw: unknown }> {
  const response = await canvaFetch("/autofills", accessToken, {
    method: "POST",
    body: JSON.stringify({
      brand_template_id: templateId,
      data: autofillData,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Canva autofill failed: ${response.status} ${text.slice(0, 400)}`);
  }

  const data = await response.json();
  const designId = data.design?.id ?? data.job?.design?.id ?? data.id;
  if (!designId) throw new Error("No design ID returned from Canva autofill");

  return { designId: String(designId), raw: data };
}

export async function exportDesign(
  accessToken: string,
  designId: string,
  format: "png" | "jpg" = "png"
): Promise<CanvaExportResult> {
  const createRes = await canvaFetch(`/exports`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      design_id: designId,
      format: { type: format, quality: "high" },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Canva export create failed: ${createRes.status}`);
  }

  const createData = await createRes.json();
  const exportId = createData.job?.id ?? createData.export?.id ?? createData.id;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await canvaFetch(`/exports/${exportId}`, accessToken);
    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();
    const status = pollData.job?.status ?? pollData.status;
    if (status === "success" || status === "completed") {
      const urls = pollData.job?.urls ?? pollData.urls ?? [];
      const exportUrl = urls[0] ?? pollData.job?.url ?? pollData.url;
      if (!exportUrl) throw new Error("Canva export completed but no URL");
      return { designId, exportUrl, raw: pollData };
    }
    if (status === "failed") throw new Error("Canva export job failed");
  }

  throw new Error("Canva export timed out");
}

export function buildAutofillFields(campaign: {
  title?: string | null;
  email_subject?: string | null;
  call_to_action?: string;
  internal_summary?: string | null;
}): Record<string, string> {
  return {
    headline: campaign.title ?? campaign.email_subject ?? "UFF PRO Portal",
    subheadline: campaign.internal_summary?.slice(0, 120) ?? "",
    cta: campaign.call_to_action ?? "Learn More",
    footer: "United Fidelity Funding | NMLS #34381",
  };
}

export function injectImageIntoHtml(html: string, imageUrl: string, alt: string): string {
  return injectUffHeroImage(html, imageUrl, alt);
}

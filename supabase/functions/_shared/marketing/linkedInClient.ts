/** LinkedIn organization posting via Community Management API (Posts + Images). */

const LINKEDIN_API_VERSION = "202405";
const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_IMAGES_INIT_URL = "https://api.linkedin.com/rest/images?action=initializeUpload";

export interface LinkedInPublishResult {
  postId?: string;
  imageUrn?: string;
  raw: unknown;
  success: boolean;
  error?: string;
}

export function isLinkedInConfigured(): boolean {
  return !!(
    Deno.env.get("LINKEDIN_ACCESS_TOKEN") &&
    Deno.env.get("LINKEDIN_ORGANIZATION_ID")
  );
}

/**
 * Auto-post after email send.
 * Env LINKEDIN_AUTO_POST_ENABLED=true always wins; otherwise reads marketing_settings.
 */
export async function isLinkedInAutoPostEnabled(
  getSetting?: (key: string) => Promise<unknown>
): Promise<boolean> {
  if (Deno.env.get("LINKEDIN_AUTO_POST_ENABLED") === "true") return true;
  if (getSetting) {
    const fromDb = await getSetting("linkedin_auto_post_enabled");
    return fromDb === true || fromDb === "true";
  }
  return false;
}

function linkedInHeaders(accessToken: string, contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function organizationUrn(orgId: string): string {
  return `urn:li:organization:${orgId}`;
}

/**
 * Upload a remote image to LinkedIn and return the image URN for Posts API media.id.
 */
export async function uploadImageFromUrl(
  accessToken: string,
  orgId: string,
  imageUrl: string
): Promise<{ imageUrn: string } | { error: string; raw?: unknown }> {
  let imageBytes: ArrayBuffer;
  let contentType = "image/png";
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return { error: `Failed to download hero image (${imgRes.status})` };
    }
    contentType = imgRes.headers.get("content-type")?.split(";")[0]?.trim() || contentType;
    if (!contentType.startsWith("image/")) contentType = "image/png";
    imageBytes = await imgRes.arrayBuffer();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to download hero image" };
  }

  const initRes = await fetch(LINKEDIN_IMAGES_INIT_URL, {
    method: "POST",
    headers: linkedInHeaders(accessToken, "application/json"),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: organizationUrn(orgId),
      },
    }),
  });

  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    return {
      error: `LinkedIn image init failed (${initRes.status})`,
      raw: initData,
    };
  }

  const value = (initData as { value?: Record<string, unknown> }).value ?? {};
  const uploadUrl = typeof value.uploadUrl === "string" ? value.uploadUrl : null;
  const imageUrn = typeof value.image === "string" ? value.image : null;
  if (!uploadUrl || !imageUrn) {
    return { error: "LinkedIn image init missing uploadUrl/image URN", raw: initData };
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body: imageBytes,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    return {
      error: `LinkedIn image upload failed (${uploadRes.status})`,
      raw: { status: uploadRes.status, body: text.slice(0, 300) },
    };
  }

  return { imageUrn };
}

export async function publishOrganizationPost(opts: {
  text: string;
  imageUrl?: string;
}): Promise<LinkedInPublishResult> {
  const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  const orgId = Deno.env.get("LINKEDIN_ORGANIZATION_ID");

  if (!accessToken || !orgId) {
    return {
      success: false,
      error:
        "LinkedIn not configured. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORGANIZATION_ID in Supabase secrets.",
      raw: {},
    };
  }

  const author = organizationUrn(orgId);
  let imageUrn: string | undefined;

  if (opts.imageUrl) {
    const uploaded = await uploadImageFromUrl(accessToken, orgId, opts.imageUrl);
    if ("error" in uploaded) {
      return {
        success: false,
        error: uploaded.error,
        raw: uploaded.raw ?? {},
      };
    }
    imageUrn = uploaded.imageUrn;
  }

  const body: Record<string, unknown> = {
    author,
    commentary: opts.text,
    visibility: "PUBLIC",
    lifecycleState: "PUBLISHED",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
  };

  if (imageUrn) {
    body.content = {
      media: {
        title: "UFF Marketing",
        id: imageUrn,
      },
    };
  }

  const response = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: linkedInHeaders(accessToken, "application/json"),
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : JSON.stringify(data).slice(0, 200);
    return {
      success: false,
      error: `LinkedIn Posts API ${response.status}: ${detail}`,
      raw: data,
      imageUrn,
    };
  }

  return {
    success: true,
    postId: (data as { id?: string }).id ?? response.headers.get("x-restli-id") ?? undefined,
    imageUrn,
    raw: data,
  };
}

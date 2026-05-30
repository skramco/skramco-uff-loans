/** LinkedIn organization posting — feature-flagged. */

export interface LinkedInPublishResult {
  postId?: string;
  raw: unknown;
  success: boolean;
  error?: string;
}

export function isLinkedInAutoPostEnabled(): boolean {
  return Deno.env.get("LINKEDIN_AUTO_POST_ENABLED") === "true";
}

export function isLinkedInConfigured(): boolean {
  return !!(
    Deno.env.get("LINKEDIN_ACCESS_TOKEN") &&
    Deno.env.get("LINKEDIN_ORGANIZATION_ID")
  );
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
      error: "LinkedIn not configured",
      raw: {},
    };
  }

  const author = `urn:li:organization:${orgId}`;

  const body: Record<string, unknown> = {
    author,
    commentary: opts.text,
    visibility: "PUBLIC",
    lifecycleState: "PUBLISHED",
    distribution: { feedDistribution: "MAIN_FEED" },
  };

  if (opts.imageUrl) {
    body.content = {
      media: {
        title: "UFF Marketing",
        id: opts.imageUrl,
      },
    };
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: `LinkedIn API ${response.status}`,
      raw: data,
    };
  }

  return {
    success: true,
    postId: data.id ?? response.headers.get("x-restli-id") ?? undefined,
    raw: data,
  };
}

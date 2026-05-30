/** OpenAI image generation for marketing campaigns (GPT Image + DALL-E). */

import { injectImageIntoHtml } from "./uffEmailTemplate.ts";

export interface OpenAIImageResult {
  /** Ephemeral hosted URL (DALL-E with response_format=url). */
  imageUrl?: string;
  /** Base64 payload (GPT image models always return this). */
  b64Json?: string;
  mimeType?: string;
  revisedPrompt?: string;
  raw: unknown;
}

type LegacySize = "1024x1024" | "1792x1024" | "1024x1792";
type ImageSubjectStyle = "human" | "nature" | "corporate_abstract";

const UFF_BRAND_RED = "#dc2626";

/** Appended to every image prompt — email hero + LinkedIn share the same asset. */
export const MARKETING_IMAGE_STYLE_RULES = [
  "This image is the primary hero for BOTH the marketing email and the LinkedIn post — one versatile wide hero, not a social-only graphic.",
  "Subject must be ONE of: (1) professional humans in a business/mortgage context, (2) nature scenery with a calm professional mood, OR (3) abstract corporate America (modern office geometry, skyline bokeh, glass and light).",
  `Always include one subtle, small hidden red item in the scene (UFF brand red ${UFF_BRAND_RED}) — e.g. a red pen, red mug, red tie accent, red notebook corner, single red leaf, or tiny red geometric shape. It should be discoverable on close look but not loud or logo-like.`,
  "Photorealistic or polished editorial style. Navy, white, and neutral tones dominate; red only via the hidden accent item.",
  "No text overlays, no rate numbers, no logos, no guaranteed-approval language, no borrower PII.",
  "Broker-facing, professional, United Fidelity Funding wholesale mortgage marketing.",
].join(" ");

function isGptImageModel(model: string): boolean {
  return model.startsWith("gpt-image");
}

function mapSizeForModel(model: string, size: LegacySize): string {
  if (!isGptImageModel(model)) return size;
  if (size === "1792x1024") return "1536x1024";
  if (size === "1024x1792") return "1024x1536";
  return size;
}

function pickImageSubjectStyle(campaign: {
  title?: string | null;
  campaign_type?: string;
  metadata?: Record<string, unknown>;
}): ImageSubjectStyle {
  const growthTip = campaign.metadata?.growthTip as { tipNumber?: number } | undefined;
  if (growthTip?.tipNumber) {
    const styles: ImageSubjectStyle[] = ["human", "nature", "corporate_abstract"];
    return styles[(growthTip.tipNumber - 1) % styles.length];
  }

  const seed = `${campaign.campaign_type ?? ""}:${campaign.title ?? ""}`;
  const hash = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const styles: ImageSubjectStyle[] = ["human", "nature", "corporate_abstract"];
  return styles[hash % styles.length];
}

function subjectStylePrompt(style: ImageSubjectStyle): string {
  switch (style) {
    case "human":
      return "Depict professional people (diverse, business attire) in a mortgage/wholesale lending context — e.g. advisor meeting, handshake, reviewing documents, confident team collaboration. Faces optional or softly blurred; no celebrity likenesses.";
    case "nature":
      return "Depict nature — sunrise, trees, water, open sky, or seasonal landscape — evoking trust, stability, and calm. No people required.";
    case "corporate_abstract":
      return "Depict abstract corporate America — glass office lines, geometric light, city skyline bokeh, minimalist boardroom shapes, or architectural finance aesthetic. No readable text.";
  }
}

export function applyMarketingImageStyleRules(basePrompt: string): string {
  const trimmed = basePrompt.trim();
  return trimmed ? `${trimmed}\n\n${MARKETING_IMAGE_STYLE_RULES}` : MARKETING_IMAGE_STYLE_RULES;
}

export async function generateMarketingImage(
  prompt: string,
  opts?: { size?: LegacySize }
): Promise<OpenAIImageResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1";
  const requestedSize = opts?.size ?? "1792x1024";
  const size = mapSizeForModel(model, requestedSize);
  const styledPrompt = applyMarketingImageStyleRules(prompt);

  const body: Record<string, unknown> = {
    model,
    prompt: styledPrompt.slice(0, 4000),
    n: 1,
    size,
  };

  if (isGptImageModel(model)) {
    body.quality = Deno.env.get("OPENAI_IMAGE_QUALITY") || "medium";
    body.output_format = Deno.env.get("OPENAI_IMAGE_OUTPUT_FORMAT") || "png";
  } else {
    body.quality = model === "dall-e-3" ? "standard" : "standard";
    body.response_format = "url";
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message ?? JSON.stringify(data).slice(0, 300);
    throw new Error(`OpenAI image generation failed: ${msg}`);
  }

  const item = data.data?.[0];
  if (!item) throw new Error("OpenAI returned no image data");

  const outputFormat = (body.output_format as string | undefined) ?? "png";
  const mimeType =
    outputFormat === "jpeg" || outputFormat === "jpg"
      ? "image/jpeg"
      : outputFormat === "webp"
        ? "image/webp"
        : "image/png";

  if (item.url) {
    return {
      imageUrl: item.url,
      revisedPrompt: item.revised_prompt,
      raw: { model, size },
    };
  }

  if (item.b64_json) {
    return {
      b64Json: item.b64_json,
      mimeType,
      revisedPrompt: item.revised_prompt,
      raw: { model, size },
    };
  }

  throw new Error("OpenAI returned no image URL or base64 data");
}

export function buildImagePrompt(campaign: {
  title?: string | null;
  email_subject?: string | null;
  canva_prompt?: string | null;
  internal_summary?: string | null;
  campaign_type?: string;
  metadata?: Record<string, unknown>;
}): string {
  const subjectStyle = pickImageSubjectStyle(campaign);
  const styleLine = subjectStylePrompt(subjectStyle);

  const topicParts = [
    campaign.canva_prompt?.trim(),
    campaign.title ?? campaign.email_subject,
    campaign.internal_summary?.slice(0, 200),
  ].filter(Boolean);

  const topic = topicParts[0] ?? "UFF wholesale broker marketing";

  return [
    `Wide hero photograph for United Fidelity Funding (UFF) PRO Portal marketing email and LinkedIn.`,
    `Campaign topic: ${topic}.`,
    styleLine,
  ].join(" ");
}

export { injectImageIntoHtml };

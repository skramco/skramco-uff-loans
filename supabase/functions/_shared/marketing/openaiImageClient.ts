/** OpenAI image generation for marketing campaigns (GPT Image + DALL-E). */

import { injectImageIntoHtml } from "./uffEmailTemplate.ts";
import { getEmailToneImageRules, parseEmailTone } from "./emailToneContext.ts";
import { MARKETING_IMAGE_STYLE_RULES } from "./marketingImageGuidance.ts";

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

function isGptImageModel(model: string): boolean {
  return model.startsWith("gpt-image");
}

function mapSizeForModel(model: string, size: LegacySize): string {
  if (!isGptImageModel(model)) return size;
  if (size === "1792x1024") return "1536x1024";
  if (size === "1024x1792") return "1024x1536";
  return size;
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

function campaignContextLines(campaign: {
  title?: string | null;
  email_subject?: string | null;
  internal_summary?: string | null;
  metadata?: Record<string, unknown>;
}): string[] {
  const lines: string[] = [];
  if (campaign.title?.trim()) lines.push(`Title: ${campaign.title.trim()}`);
  if (campaign.email_subject?.trim()) lines.push(`Subject: ${campaign.email_subject.trim()}`);
  if (typeof campaign.metadata?.funny_word === "string" && campaign.metadata.funny_word.trim()) {
    lines.push(`Funny word hook: ${campaign.metadata.funny_word.trim()}`);
  }
  if (campaign.internal_summary?.trim()) {
    lines.push(`Summary: ${campaign.internal_summary.trim().slice(0, 280)}`);
  }
  return lines;
}

/** Build OpenAI image prompt — content-driven, not generic office stock. */
export function buildImagePrompt(campaign: {
  title?: string | null;
  email_subject?: string | null;
  canva_prompt?: string | null;
  internal_summary?: string | null;
  campaign_type?: string;
  metadata?: Record<string, unknown>;
}): string {
  const creativeBrief = campaign.canva_prompt?.trim();
  const contextLines = campaignContextLines(campaign);
  const tone = parseEmailTone(campaign.metadata?.email_tone);
  const toneLine = getEmailToneImageRules(tone);

  const parts: string[] = [
    "Wide cinematic hero image for United Fidelity Funding (UFF) wholesale mortgage marketing (email + LinkedIn).",
  ];

  if (creativeBrief && creativeBrief.length >= 15) {
    parts.push(`PRIMARY CREATIVE DIRECTION — render this concept faithfully: ${creativeBrief}`);
  } else {
    const topic = contextLines.join(" — ") || campaign.campaign_type?.replace(/_/g, " ") || "wholesale broker success";
    parts.push(`Campaign topic: ${topic}.`);
    parts.push(
      "Invent one vivid, content-specific visual metaphor for this topic — not a generic office stock photo."
    );
  }

  if (contextLines.length > 0) {
    parts.push(`Must align with campaign copy: ${contextLines.join(" | ")}.`);
  }

  parts.push(toneLine);
  parts.push("Style: polished editorial or cinematic photorealism — imaginative, memorable, professional.");

  return parts.join(" ");
}

export { injectImageIntoHtml };

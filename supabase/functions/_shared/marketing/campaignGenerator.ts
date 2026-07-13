import {
  BROKER_GROWTH_ENGINE_PROMPT,
  EDUCATIONAL_RETRY_INSTRUCTION,
  evaluateEducationalValue,
  getCampaignTypeIntelligence,
  UFF_WHOLESALE_PRODUCT_MENU,
} from "./brokerIntelligenceContext.ts";
import { BRAND_SYSTEM_PROMPT, evaluateCompliance } from "./complianceGuardrails.ts";
import { computeApprovalRequired, loadApprovalSettings } from "./approvalRules.ts";
import { parseListId, resolveDefaultListId } from "./activeCampaignClient.ts";
import type { MarketingRepository } from "./repository.ts";
import type { CampaignType, GeneratedCampaignContent, MarketingTemplateRow } from "./types.ts";
import { finalizeCampaignEmail, appendAccountExecutivePlainText, htmlFragmentToPlainText, plainTextToEmailBodyHtml } from "./uffEmailTemplate.ts";
import {
  rewriteBodyLinksForLanding,
  rewritePlainTextLinksForLanding,
  rewriteLinkedInPostForLanding,
} from "./proLandingPage.ts";

import type { BrokerGrowthTip } from "./brokerGrowthTips.ts";
import { callOpenAI } from "./openaiClient.ts";
import {
  DAILY_BRIEFING_CAMPAIGN_TYPE,
  DAILY_MARKET_BRIEFING_PROMPT_RULES,
  DailyMarketBriefingUnavailableError,
  MARKET_COMMENTARY_PROMPT_RULES,
  MARKET_DATA_CAMPAIGN_TYPES,
  fetchMarketDataSummary,
  fetchTodayMarketBriefing,
} from "./marketDataContext.ts";
import {
  enforceDailyBriefingDateFields,
  getDailyBriefingDatePromptBlock,
} from "./mortgageNewsRssContext.ts";
import { PRO_PORTAL_PRODUCT_CONTEXT, PRO_PORTAL_PUBLIC_PAGE_URL, needsProPortalContext } from "./proPortalContext.ts";
import { deriveLinkedInFromBodyCopy, formatLinkedInCaption } from "./linkedinPostFormat.ts";
import { getLinkedInHashtagHints, LINKEDIN_POST_GUIDANCE } from "./linkedinPostGuidance.ts";
import { CANVA_PROMPT_GUIDANCE } from "./marketingImageGuidance.ts";
import {
  DEFAULT_EMAIL_TONE,
  evaluateToneDelivery,
  fetchRealTimeContext,
  getEmailTonePromptBlock,
  getEmailToneSystemPromptBlock,
  getToneRetryInstruction,
  parseEmailTone,
  type EmailTone,
  type EmailTonePromptOptions,
} from "./emailToneContext.ts";

export { callOpenAI, DailyMarketBriefingUnavailableError };

const PRODUCT_INTELLIGENCE_TYPES = new Set<CampaignType>([
  "conventional_product_spotlight",
  "fha_product_spotlight",
  "va_product_spotlight",
  "usda_product_spotlight",
  "non_qm_product_spotlight",
  "jumbo_product_spotlight",
  "loan_rescue",
  "scenario_desk",
]);

export function buildSystemPrompt(
  templateSystem?: string | null,
  emailTone: EmailTone = DEFAULT_EMAIL_TONE,
  toneOpts: EmailTonePromptOptions = {}
): string {
  const parts = [BROKER_GROWTH_ENGINE_PROMPT, BRAND_SYSTEM_PROMPT];
  if (templateSystem?.trim()) {
    parts.push(`Additional template rules:\n${templateSystem.trim()}`);
  }
  parts.push(getEmailToneSystemPromptBlock(emailTone, toneOpts));
  return parts.join("\n\n");
}

export interface GenerateOptions {
  campaignType: CampaignType;
  template?: MarketingTemplateRow | null;
  vestaInsights?: string[];
  performanceSummary?: string;
  audienceListId?: string;
  tipBrief?: BrokerGrowthTip;
  tipUserPrompt?: string;
  marketDataSummary?: string | null;
  realTimeContext?: string | null;
  emailTone?: EmailTone;
}

function parseGeneratedJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in AI response");
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

export function buildUserPrompt(options: GenerateOptions): string {
  const parts: string[] = [getCampaignTypeIntelligence(options.campaignType)];

  if (PRODUCT_INTELLIGENCE_TYPES.has(options.campaignType)) {
    parts.push(`\n${UFF_WHOLESALE_PRODUCT_MENU}`);
  }

  if (options.template?.prompt_user) {
    parts.push(`Template instructions:\n${options.template.prompt_user}`);
  } else {
    parts.push(`Generate a ${options.campaignType} marketing campaign.`);
  }

  if (options.vestaInsights?.length) {
    parts.push(
      `\nOperational insights (aggregate, non-PII — use carefully, set uses_vesta_insights: true):\n${options.vestaInsights.join("\n")}`
    );
  }

  if (options.performanceSummary) {
    parts.push(`\nPast campaign performance context:\n${options.performanceSummary}`);
  }

  if (options.tipUserPrompt) {
    parts.push(`\n${options.tipUserPrompt}`);
  }

  if (options.campaignType === DAILY_BRIEFING_CAMPAIGN_TYPE) {
    parts.push(`\n${getDailyBriefingDatePromptBlock()}`);
    parts.push(`\n${DAILY_MARKET_BRIEFING_PROMPT_RULES}`);
    if (options.marketDataSummary) {
      parts.push(`\n${options.marketDataSummary}`);
    }
  } else if (MARKET_DATA_CAMPAIGN_TYPES.has(options.campaignType)) {
    parts.push(`\n${MARKET_COMMENTARY_PROMPT_RULES}`);
    if (options.marketDataSummary) {
      parts.push(`\n${options.marketDataSummary}`);
    } else {
      parts.push(
        "\nNote: FRED market data unavailable — write cautiously without specific rate or economic figures; focus on general broker guidance and disclose that data was not attached."
      );
    }
  }

  if (needsProPortalContext(options.campaignType)) {
    parts.push(`\n${PRO_PORTAL_PRODUCT_CONTEXT}`);
  }

  parts.push(`\n${LINKEDIN_POST_GUIDANCE}`);
  parts.push(`\n${getLinkedInHashtagHints(options.campaignType)}`);
  parts.push(`\n${CANVA_PROMPT_GUIDANCE}`);

  const tone = options.emailTone ?? DEFAULT_EMAIL_TONE;
  parts.push(
    `\n${getEmailTonePromptBlock(tone, {
      realTimeContext: options.realTimeContext ?? undefined,
    })}`
  );

  parts.push("\nReturn JSON only.");
  return parts.join("\n");
}

export function mapAiResponseToCampaign(
  campaignType: CampaignType,
  parsed: Record<string, unknown>,
  audienceListId?: string,
  canvaTemplateId?: string | null
): GeneratedCampaignContent {
  const getStr = (k: string, fallback = ""): string =>
    typeof parsed[k] === "string" ? (parsed[k] as string) : fallback;

  const aiScore =
    typeof parsed.compliance_risk_score === "number"
      ? parsed.compliance_risk_score
      : 0.3;

  return {
    campaign_type: campaignType,
    title: getStr("title", `${campaignType} Campaign`),
    internal_summary: getStr("internal_summary"),
    email_subject: getStr("email_subject"),
    preview_text: getStr("preview_text"),
    email_html: getStr("email_html"),
    email_text: getStr("email_text"),
    linkedin_post: getStr("linkedin_post"),
    canva_prompt: getStr("canva_prompt"),
    canva_template_id: canvaTemplateId ?? (getStr("canva_template_id") || undefined),
    call_to_action: getStr("call_to_action", "Log in to PRO Portal"),
    audience_list_id: audienceListId,
    compliance_risk_score: aiScore,
    approval_required: true,
    consumer_facing: parsed.consumer_facing === true,
    uses_vesta_insights: parsed.uses_vesta_insights === true,
  };
}

export async function generateCampaignContent(
  repo: MarketingRepository,
  options: GenerateOptions
): Promise<GeneratedCampaignContent> {
  const template = options.template ?? (await repo.getTemplateByType(options.campaignType));
  const emailTone = options.emailTone ?? DEFAULT_EMAIL_TONE;
  const toneOpts: EmailTonePromptOptions = {};
  const systemPrompt = buildSystemPrompt(template?.prompt_system, emailTone, toneOpts);

  let marketDataSummary: string | null = null;
  if (options.campaignType === DAILY_BRIEFING_CAMPAIGN_TYPE) {
    marketDataSummary = await fetchTodayMarketBriefing();
  } else if (MARKET_DATA_CAMPAIGN_TYPES.has(options.campaignType)) {
    try {
      marketDataSummary = await fetchMarketDataSummary();
    } catch (e) {
      console.warn("FRED market data fetch failed:", e);
    }
  }

  let realTimeContext: string | undefined;
  if (emailTone === "real_time" && options.campaignType !== DAILY_BRIEFING_CAMPAIGN_TYPE) {
    try {
      realTimeContext = await fetchRealTimeContext();
    } catch (e) {
      console.warn("Real-time context fetch failed:", e);
    }
  }

  let userPrompt = buildUserPrompt({
    ...options,
    template,
    marketDataSummary,
    realTimeContext,
    emailTone,
  });
  let parsed: Record<string, unknown> = {};

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callOpenAI(systemPrompt, userPrompt);
    parsed = parseGeneratedJson(raw);
    const draft = mapAiResponseToCampaign(options.campaignType, parsed);
    const edu = evaluateEducationalValue(
      {
        email_subject: draft.email_subject,
        preview_text: draft.preview_text,
        email_html: draft.email_html,
        email_text: draft.email_text,
        internal_summary: draft.internal_summary,
      },
      { campaignType: options.campaignType }
    );
    const toneCheck = evaluateToneDelivery(emailTone, draft);
    if ((edu.passes && toneCheck.passes) || attempt === 2) {
      if (!toneCheck.passes) {
        console.warn("Tone check failed after retries:", toneCheck.reasons, "tone:", emailTone);
      }
      break;
    }
    if (!edu.passes) {
      console.warn("Broker intelligence check failed, regenerating:", edu.reasons);
      userPrompt = `${userPrompt}\n\n${EDUCATIONAL_RETRY_INSTRUCTION}\nFailure reasons: ${edu.reasons.join("; ")}`;
      continue;
    }
    console.warn("Tone check failed, regenerating:", toneCheck.reasons, "tone:", emailTone);
    userPrompt = `${userPrompt}\n\n${getToneRetryInstruction(emailTone, toneCheck.reasons, toneOpts)}`;
  }

  const defaultList =
    options.audienceListId ??
    template?.default_audience_list_id ??
    (await resolveDefaultListId((k) => repo.getSetting(k))) ??
    undefined;
  const normalizedList = parseListId(defaultList);

  const campaign = mapAiResponseToCampaign(
    options.campaignType,
    parsed,
    normalizedList,
    template?.canva_template_id
  );

  if (options.campaignType === DAILY_BRIEFING_CAMPAIGN_TYPE) {
    enforceDailyBriefingDateFields(campaign);
  }

  if (campaign.linkedin_post?.trim()) {
    campaign.linkedin_post = formatLinkedInCaption(campaign.linkedin_post, {
      proPortalUrl: PRO_PORTAL_PUBLIC_PAGE_URL,
    });
  }

  const compliance = evaluateCompliance({
    email_subject: campaign.email_subject,
    preview_text: campaign.preview_text,
    email_html: campaign.email_html,
    email_text: campaign.email_text,
    linkedin_post: campaign.linkedin_post,
    consumer_facing: campaign.consumer_facing,
    uses_vesta_insights: campaign.uses_vesta_insights,
    aiRiskScore: campaign.compliance_risk_score,
  });

  campaign.compliance_risk_score = Math.max(
    campaign.compliance_risk_score,
    compliance.riskScore
  );

  const approvalSettings = await loadApprovalSettings((k) => repo.getSetting(k));
  campaign.approval_required = computeApprovalRequired(campaign, approvalSettings);

  return campaign;
}

/** Wrap body fragment with UFF email shell; optionally point CTA + body links to landing page. */
export function finalizeGeneratedCampaign(
  campaign: GeneratedCampaignContent,
  opts?: {
    ctaUrl?: string;
    heroImageUrl?: string;
    /** When false, LinkedIn copy is not updated with landing URL (used until campaign approval). */
    attachLandingToLinkedIn?: boolean;
  }
): GeneratedCampaignContent {
  const ctaUrl = opts?.ctaUrl ?? PRO_PORTAL_PUBLIC_PAGE_URL;
  const bodyFragment = rewriteBodyLinksForLanding(campaign.email_html, ctaUrl);
  const plainText = rewritePlainTextLinksForLanding(campaign.email_text, ctaUrl);

  const attachLinkedIn = opts?.attachLandingToLinkedIn !== false && !!opts?.ctaUrl;

  return {
    ...campaign,
    email_html: finalizeCampaignEmail(
      { ...campaign, email_html: bodyFragment, email_text: plainText },
      { heroImageUrl: opts?.heroImageUrl, ctaUrl }
    ),
    email_text: appendAccountExecutivePlainText(plainText),
    linkedin_post:
      attachLinkedIn && opts?.ctaUrl
        ? rewriteLinkedInPostForLanding(campaign.linkedin_post, opts.ctaUrl)
        : campaign.linkedin_post,
  };
}

export function campaignRowToGeneratedContent(
  campaign: {
    id: string;
    campaign_type: string;
    title?: string | null;
    internal_summary?: string | null;
    email_subject?: string | null;
    preview_text?: string | null;
    email_html?: string | null;
    email_text?: string | null;
    linkedin_post?: string | null;
    canva_prompt?: string | null;
    compliance_risk_score?: number | null;
    approval_required?: boolean;
  },
  meta: Record<string, unknown>
): GeneratedCampaignContent {
  const bodyFragment =
    typeof meta.email_body_fragment === "string"
      ? meta.email_body_fragment
      : (campaign.email_html ?? "");
  const textFragment =
    typeof meta.email_text_fragment === "string"
      ? meta.email_text_fragment
      : (campaign.email_text ?? "");

  return {
    campaign_type: campaign.campaign_type as CampaignType,
    title: campaign.title ?? "UFF Update",
    internal_summary: campaign.internal_summary ?? "",
    email_subject: campaign.email_subject ?? "",
    preview_text: campaign.preview_text ?? "",
    email_html: bodyFragment,
    email_text: textFragment,
    linkedin_post: campaign.linkedin_post ?? "",
    canva_prompt: campaign.canva_prompt ?? "",
    call_to_action:
      typeof meta.call_to_action === "string" ? meta.call_to_action : "Log in to PRO Portal",
    compliance_risk_score: campaign.compliance_risk_score ?? 0.3,
    approval_required: campaign.approval_required ?? true,
  };
}

export async function regenerateField(
  repo: MarketingRepository,
  campaignType: CampaignType,
  field: "subject" | "linkedin" | "canva_prompt" | "email_html",
  currentContent: Partial<GeneratedCampaignContent>,
  emailToneOverride?: EmailTone
): Promise<Partial<GeneratedCampaignContent>> {
  const fieldMap: Record<string, string> = {
    subject: "Regenerate only the email_subject and preview_text fields as JSON: { email_subject, preview_text }",
    linkedin: `Regenerate only linkedin_post as JSON: { linkedin_post }. ${LINKEDIN_POST_GUIDANCE}`,
    canva_prompt: `Regenerate only canva_prompt as JSON: { canva_prompt }. ${CANVA_PROMPT_GUIDANCE}`,
    email_html:
      "Regenerate email body content as JSON: { email_html, email_text }. email_html must be a BODY FRAGMENT only (paragraphs/highlight boxes — no logo, header, footer, or full HTML document). Keep subject consistent.",
  };

  const template = await repo.getTemplateByType(campaignType);
  const emailTone = emailToneOverride ?? DEFAULT_EMAIL_TONE;
  let toneContext: string | undefined;
  if (emailTone === "real_time") {
    try {
      toneContext = await fetchRealTimeContext();
    } catch {
      toneContext = undefined;
    }
  }
  const toneOpts: EmailTonePromptOptions = { realTimeContext: toneContext };
  const systemPrompt = buildSystemPrompt(template?.prompt_system, emailTone, toneOpts);

  let userPrompt = `${fieldMap[field]}\n\nCurrent campaign context:\n${JSON.stringify(currentContent, null, 2)}`;
  userPrompt += `\n\n${getEmailTonePromptBlock(emailTone, toneOpts)}`;
  if (field === "linkedin") {
    userPrompt += `\n\n${getLinkedInHashtagHints(campaignType)}`;
  }
  const raw = await callOpenAI(systemPrompt, userPrompt);
  const parsed = parseGeneratedJson(raw);

  const patch: Partial<GeneratedCampaignContent> = {};
  if (field === "subject") {
    patch.email_subject = String(parsed.email_subject ?? "");
    patch.preview_text = String(parsed.preview_text ?? "");
  } else if (field === "linkedin") {
    const landingUrl =
      typeof (currentContent as Record<string, unknown>).landing_page_url === "string"
        ? ((currentContent as Record<string, unknown>).landing_page_url as string)
        : undefined;
    let post = String(parsed.linkedin_post ?? "");
    post = landingUrl
      ? rewriteLinkedInPostForLanding(post, landingUrl)
      : formatLinkedInCaption(post, { proPortalUrl: PRO_PORTAL_PUBLIC_PAGE_URL });
    patch.linkedin_post = post;
  } else if (field === "canva_prompt") {
    patch.canva_prompt = String(parsed.canva_prompt ?? "");
  } else if (field === "email_html") {
    const bodyFragment = String(parsed.email_html ?? "");
    const landingUrl =
      typeof (currentContent as Record<string, unknown>).landing_page_url === "string"
        ? ((currentContent as Record<string, unknown>).landing_page_url as string)
        : undefined;
    const finalized = finalizeGeneratedCampaign(
      {
        campaign_type: campaignType,
        title: currentContent.title ?? "UFF Update",
        internal_summary: currentContent.internal_summary ?? "",
        email_subject: currentContent.email_subject ?? "",
        preview_text: currentContent.preview_text ?? "",
        email_html: bodyFragment,
        email_text: String(parsed.email_text ?? ""),
        linkedin_post: currentContent.linkedin_post ?? "",
        canva_prompt: currentContent.canva_prompt ?? "",
        call_to_action: currentContent.call_to_action ?? "Visit PRO Portal",
        compliance_risk_score: 0.3,
        approval_required: true,
      },
      {
        ctaUrl: landingUrl ?? PRO_PORTAL_PUBLIC_PAGE_URL,
        attachLandingToLinkedIn: !!landingUrl,
      }
    );
    patch.email_html = finalized.email_html;
    patch.email_text = finalized.email_text;
    // Preserve raw fragments for manual "Edit content" (not part of GeneratedCampaignContent columns)
    (patch as Record<string, unknown>).email_body_fragment = bodyFragment;
    (patch as Record<string, unknown>).email_text_fragment = String(parsed.email_text ?? "");
  }

  return patch;
}

export type ManualCampaignContentEdits = {
  title?: string;
  internal_summary?: string;
  email_subject?: string;
  preview_text?: string;
  /** Body fragment only (paragraphs / boxes) — not the full UFF shell. */
  email_body_fragment?: string;
  /** Shared plain-text body copy — source of truth for email text + LinkedIn. */
  email_text_fragment?: string;
  linkedin_post?: string;
  canva_prompt?: string;
  call_to_action?: string;
  /** When true (default if body copy changes), LinkedIn is rebuilt from body copy. */
  sync_linkedin_from_body?: boolean;
};

/**
 * Apply user content edits and rebuild the branded email HTML from the body fragment.
 * Keeps hero image + landing CTA when present.
 * Body copy is edited once: plain text drives email HTML + LinkedIn caption.
 */
export function buildManualContentPatch(
  campaign: {
    campaign_type: string;
    title?: string | null;
    internal_summary?: string | null;
    email_subject?: string | null;
    preview_text?: string | null;
    email_html?: string | null;
    email_text?: string | null;
    linkedin_post?: string | null;
    canva_prompt?: string | null;
    compliance_risk_score?: number | null;
    approval_required?: boolean;
    image_asset_url?: string | null;
    canva_export_url?: string | null;
    metadata?: Record<string, unknown> | null;
  },
  edits: ManualCampaignContentEdits
): Record<string, unknown> {
  const meta = { ...(campaign.metadata ?? {}) } as Record<string, unknown>;
  const existingBodyFragment =
    typeof meta.email_body_fragment === "string" ? meta.email_body_fragment : null;
  const existingTextFragment =
    typeof meta.email_text_fragment === "string" ? meta.email_text_fragment : null;

  const title = edits.title !== undefined ? edits.title : (campaign.title ?? "UFF Update");
  const internalSummary =
    edits.internal_summary !== undefined
      ? edits.internal_summary
      : (campaign.internal_summary ?? "");
  const emailSubject =
    edits.email_subject !== undefined ? edits.email_subject : (campaign.email_subject ?? "");
  const previewText =
    edits.preview_text !== undefined ? edits.preview_text : (campaign.preview_text ?? "");
  const canvaPrompt =
    edits.canva_prompt !== undefined ? edits.canva_prompt : (campaign.canva_prompt ?? "");
  const callToAction =
    edits.call_to_action !== undefined
      ? edits.call_to_action
      : typeof meta.call_to_action === "string"
        ? meta.call_to_action
        : "Visit PRO Portal";

  // Single source of truth: plain body copy. HTML fragment is derived when only text is sent.
  const bodyCopyChanged = edits.email_text_fragment !== undefined;
  const htmlFragmentChanged = edits.email_body_fragment !== undefined;

  let textFragment: string;
  let bodyFragment: string;

  if (bodyCopyChanged) {
    const rawCopy = String(edits.email_text_fragment ?? "").trim();
    textFragment = /<[^>]+>/.test(rawCopy) ? htmlFragmentToPlainText(rawCopy) : rawCopy;
    bodyFragment = plainTextToEmailBodyHtml(textFragment);
  } else if (htmlFragmentChanged) {
    bodyFragment = String(edits.email_body_fragment ?? "");
    textFragment = htmlFragmentToPlainText(bodyFragment);
  } else {
    textFragment = existingTextFragment ?? campaign.email_text ?? "";
    bodyFragment = existingBodyFragment ?? "";
  }

  const landingUrl =
    typeof meta.landing_page_url === "string" && meta.landing_page_url
      ? meta.landing_page_url
      : PRO_PORTAL_PUBLIC_PAGE_URL;

  const shouldSyncLinkedIn =
    edits.sync_linkedin_from_body === true ||
    (edits.sync_linkedin_from_body !== false &&
      edits.linkedin_post === undefined &&
      (bodyCopyChanged || htmlFragmentChanged));

  let linkedinPost: string;
  if (edits.linkedin_post !== undefined && !shouldSyncLinkedIn) {
    linkedinPost = edits.linkedin_post;
  } else if (shouldSyncLinkedIn) {
    linkedinPost = deriveLinkedInFromBodyCopy(textFragment, campaign.linkedin_post, {
      landingUrl:
        typeof meta.landing_page_url === "string" && meta.landing_page_url
          ? meta.landing_page_url
          : undefined,
      proPortalUrl: PRO_PORTAL_PUBLIC_PAGE_URL,
    });
  } else {
    linkedinPost = campaign.linkedin_post ?? "";
  }

  const shouldRebuildEmail =
    bodyCopyChanged ||
    htmlFragmentChanged ||
    edits.call_to_action !== undefined ||
    edits.title !== undefined ||
    edits.email_subject !== undefined ||
    edits.preview_text !== undefined;

  const patch: Record<string, unknown> = {
    title,
    internal_summary: internalSummary,
    email_subject: emailSubject,
    preview_text: previewText,
    linkedin_post: linkedinPost,
    canva_prompt: canvaPrompt,
  };

  if (shouldRebuildEmail && (bodyFragment.trim() || textFragment.trim())) {
    const fragmentForEmail = bodyFragment.trim()
      ? bodyFragment
      : plainTextToEmailBodyHtml(textFragment);
    const heroImageUrl = campaign.image_asset_url ?? campaign.canva_export_url ?? undefined;
    const finalized = finalizeGeneratedCampaign(
      {
        campaign_type: campaign.campaign_type as CampaignType,
        title,
        internal_summary: internalSummary,
        email_subject: emailSubject,
        preview_text: previewText,
        email_html: fragmentForEmail,
        email_text: textFragment,
        linkedin_post: linkedinPost,
        canva_prompt: canvaPrompt,
        call_to_action: callToAction,
        compliance_risk_score: campaign.compliance_risk_score ?? 0.3,
        approval_required: campaign.approval_required ?? true,
      },
      {
        ctaUrl: landingUrl,
        heroImageUrl: heroImageUrl ?? undefined,
        attachLandingToLinkedIn: false,
      }
    );
    patch.email_html = finalized.email_html;
    patch.email_text = finalized.email_text;
    meta.email_body_fragment = fragmentForEmail;
    meta.email_text_fragment = textFragment;
    meta.call_to_action = callToAction;
    meta.content_edited_at = new Date().toISOString();
    if (shouldSyncLinkedIn) meta.linkedin_synced_from_body = true;
    patch.metadata = meta;
  } else if (edits.call_to_action !== undefined || shouldSyncLinkedIn) {
    if (edits.call_to_action !== undefined) meta.call_to_action = callToAction;
    if (shouldSyncLinkedIn) meta.linkedin_synced_from_body = true;
    patch.metadata = meta;
  }

  return patch;
}

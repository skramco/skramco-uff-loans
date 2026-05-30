import type { ComplianceResult } from "./types.ts";

const FORBIDDEN_PHRASES = [
  "guaranteed approval",
  "instant approval",
  "guaranteed rate",
  "best rate",
  "lowest rate",
  "eliminate all",
  "always approved",
  "never denied",
  "promise approval",
  "100% approval",
];

const SUPERLATIVES = [
  "best",
  "lowest",
  "highest",
  "fastest",
  "cheapest",
  "guaranteed",
  "always",
  "never",
  "every",
];

const COMPLIANCE_KEYWORDS = [
  "fha",
  "va loan",
  "veterans affairs",
  "fannie mae",
  "freddie mac",
  "cfpb",
  " apr",
  "apr ",
  "interest rate",
  "credit score",
  "pre-approval",
  "preapproval",
  "pricing",
  "rate lock",
];

const APPROVAL_KEYWORDS = ["approval", "approved", "qualify", "qualification"];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function scanText(text: string): { flags: string[]; violations: string[]; score: number } {
  const normalized = normalize(text);
  const flags: string[] = [];
  const violations: string[] = [];
  let score = 0;

  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalized.includes(phrase)) {
      violations.push(`Forbidden phrase: "${phrase}"`);
      score += 0.25;
    }
  }

  for (const word of SUPERLATIVES) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(normalized)) {
      flags.push(`superlative:${word}`);
      score += 0.08;
    }
  }

  for (const kw of COMPLIANCE_KEYWORDS) {
    if (normalized.includes(kw.trim())) {
      flags.push(`compliance_keyword:${kw.trim()}`);
      score += 0.1;
    }
  }

  for (const kw of APPROVAL_KEYWORDS) {
    if (normalized.includes(kw)) {
      flags.push(`approval_reference:${kw}`);
      score += 0.05;
    }
  }

  return { flags, violations, score: Math.min(1, score) };
}

export function evaluateCompliance(content: {
  email_subject?: string;
  preview_text?: string;
  email_html?: string;
  email_text?: string;
  linkedin_post?: string;
  consumer_facing?: boolean;
  uses_vesta_insights?: boolean;
  aiRiskScore?: number;
}): ComplianceResult {
  const combined = [
    content.email_subject,
    content.preview_text,
    content.email_html,
    content.email_text,
    content.linkedin_post,
  ]
    .filter(Boolean)
    .join("\n");

  const scan = scanText(combined);
  let riskScore = Math.max(scan.score, content.aiRiskScore ?? 0);

  if (content.consumer_facing) {
    scan.flags.push("consumer_facing");
    riskScore = Math.min(1, riskScore + 0.15);
  }

  if (content.uses_vesta_insights) {
    scan.flags.push("vesta_insights");
    riskScore = Math.min(1, riskScore + 0.1);
  }

  const uniqueFlags = [...new Set(scan.flags)];

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    flags: uniqueFlags,
    violations: scan.violations,
    requiresApproval: true, // computed fully in approvalRules
  };
}

export function stripPIIFromText(text: string): string {
  let out = text;
  // Email
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  // Phone
  out = out.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED_PHONE]");
  // SSN-like
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  // Loan numbers (common patterns)
  out = out.replace(/\bloan\s*#?\s*\d{5,}\b/gi, "[REDACTED_LOAN]");
  return out;
}

export const BRAND_SYSTEM_PROMPT = `You are a mortgage marketing copywriter for United Fidelity Funding (UFF) and the PRO Portal wholesale platform.

BRAND: United Fidelity Funding / UFF / PRO Portal
AUDIENCE: Wholesale mortgage brokers (unless explicitly marked consumer-facing)

MORTGAGE MARKETING GUARDRAILS — YOU MUST FOLLOW:
- Do NOT promise loan approval or imply guaranteed outcomes.
- Do NOT imply guaranteed pricing or specific rates unless clearly labeled as illustrative with disclaimers.
- Do NOT make unsupported claims or use "best rate" unless backed by cited data.
- Do NOT make FHA/VA/Fannie/Freddie claims without careful, compliant wording.
- Avoid hyperbole: "every," "guaranteed," "always," "never," "eliminate all," "instant approval."
- Keep language broker-facing unless campaign is specifically marked consumer-facing.
- Never include borrower names, addresses, SSNs, DOB, phone, email, or loan numbers.
- Do NOT invent Account Executive names or contact info — the email template automatically includes ActiveCampaign merge tags (%AE-NAME%, %AE-TITLE%, %AE-EMAIL%, %AE-PHONE%) filled from each contact's AE record.
- When referencing PRO Portal, use ONLY capabilities documented at uff.pro/pro-portal. Never invent features (e.g. custom market alerts, appraisal ordering) — see PRO Portal product context in the user prompt when applicable.
- UFF is a wholesale lender, not a market research publisher. Do not claim UFF sends daily commentary, rate alert services, or proprietary forecasts.

Output valid JSON only with these fields:
{
  "title": string (email headline — shown in red header bar),
  "internal_summary": string,
  "email_subject": string,
  "preview_text": string,
  "email_html": string (BODY FRAGMENT ONLY — inner content for the white email body cell; do NOT include html/head/body, logo, header, footer, or outer tables. Use professional inline-styled fragments: <p style="font-family:Arial,sans-serif;font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">...</p>, optional highlight boxes with background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:16px. Match the tone of uff.loans transactional emails: clear, professional, broker-focused.),
  "email_text": string (plain-text version of body content only — no HTML),
  "linkedin_post": string (under 3000 chars, professional tone; include {{LANDING_PAGE_URL}} as the link to the full broker resource on uff.pro — it will be replaced with the campaign landing page URL),
  "canva_prompt": string (design brief for the shared email + LinkedIn hero image — choose ONE visual theme: professional humans, nature, OR abstract corporate America; describe scene and mood; note where a subtle hidden red #dc2626 accent object should appear),
  "call_to_action": string (short button label, e.g. "Log in to PRO Portal"),
  "compliance_risk_score": number 0-1,
  "consumer_facing": boolean,
  "uses_vesta_insights": boolean
}

LINKS: In email_html, use href="{{LANDING_PAGE_URL}}" for ALL anchor links (read-more, learn-more, etc.). A broker landing page on uff.pro will replace this placeholder before send.

The system automatically wraps email_html in the official UFF email template (red header, logo, footer, CTA button). Focus on strong body copy only.`;

/** Pure compliance logic — mirrored for Vitest (see supabase/functions/_shared/marketing). */

export interface ComplianceResult {
  riskScore: number;
  flags: string[];
  requiresApproval: boolean;
  violations: string[];
}

const FORBIDDEN_PHRASES = [
  'guaranteed approval',
  'instant approval',
  'guaranteed rate',
  'best rate',
  'lowest rate',
  'eliminate all',
];

const SUPERLATIVES = ['best', 'lowest', 'guaranteed', 'always', 'never', 'every'];

const COMPLIANCE_KEYWORDS = [
  'fha',
  'va loan',
  'fannie mae',
  'freddie mac',
  'cfpb',
  ' apr',
  'interest rate',
  'credit score',
];

const UNSUPPORTED_PRODUCT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bconstruction\s+(?:loan|loans|financing|mortgage|mortgages|program|programs)\b/i, label: 'construction loan' },
  { pattern: /\bconstruction[\s-]to[\s-]perm(?:anent)?\b/i, label: 'construction-to-perm' },
  { pattern: /\bone[\s-]time[\s-]close\s+construction\b/i, label: 'one-time close construction' },
  { pattern: /\bbuilder\s+(?:construction\s+)?(?:loan|loans|financing|program|programs)\b/i, label: 'builder construction loan' },
];

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
    .join('\n')
    .toLowerCase();

  const flags: string[] = [];
  const violations: string[] = [];
  let score = content.aiRiskScore ?? 0;

  for (const phrase of FORBIDDEN_PHRASES) {
    if (combined.includes(phrase)) {
      violations.push(`Forbidden phrase: "${phrase}"`);
      score += 0.25;
    }
  }

  for (const word of SUPERLATIVES) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(combined)) {
      flags.push(`superlative:${word}`);
      score += 0.08;
    }
  }

  for (const kw of COMPLIANCE_KEYWORDS) {
    if (combined.includes(kw.trim())) {
      flags.push(`compliance_keyword:${kw.trim()}`);
      score += 0.1;
    }
  }

  for (const { pattern, label } of UNSUPPORTED_PRODUCT_PATTERNS) {
    if (pattern.test(combined)) {
      flags.push(`unsupported_product:${label}`);
      violations.push(`UFF does not offer ${label} — remove or redirect to supported products`);
      score += 0.35;
    }
  }

  if (content.consumer_facing) {
    flags.push('consumer_facing');
    score += 0.15;
  }

  if (content.uses_vesta_insights) {
    flags.push('vesta_insights');
    score += 0.1;
  }

  return {
    riskScore: Math.min(1, Math.round(score * 100) / 100),
    flags: [...new Set(flags)],
    violations,
    requiresApproval: true,
  };
}

export function stripPIIFromText(text: string): string {
  let out = text;
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  out = out.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  out = out.replace(/\bloan\s*#?\s*\d{5,}\b/gi, '[REDACTED_LOAN]');
  return out;
}

export function canSendCampaign(
  status: string,
  approvalRequired: boolean,
  campaignType: string,
  autoSendTrustedTypes: string[]
): { allowed: boolean; reason?: string } {
  if (status === 'approved' || status === 'scheduled') return { allowed: true };
  if (status === 'sent' || status === 'failed') return { allowed: true };
  if (!approvalRequired && autoSendTrustedTypes.includes(campaignType)) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Campaign must be approved before sending' };
}

export function buildIdempotencyKey(jobType: string, date: Date): string {
  return `${jobType}:${date.toISOString().slice(0, 10)}`;
}

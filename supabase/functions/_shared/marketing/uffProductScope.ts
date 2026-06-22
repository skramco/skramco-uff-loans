/**
 * UFF wholesale product scope — what we offer vs. must never claim in marketing copy.
 */

export const UFF_PRODUCT_SCOPE_PROMPT = `
UFF PRODUCT SCOPE (wholesale — do not invent or imply products UFF does not offer):
SUPPORTED: Conventional, FHA, VA, USDA, Non-QM (DSCR, bank statement, asset depletion, interest-only, foreign national, jumbo), streamline/refi expertise where UFF offers the program.

NOT OFFERED BY UFF — never recommend, spotlight, structure, or imply UFF originates:
- Construction loans, construction-to-perm, one-time-close construction, ground-up/spec construction financing, builder construction loan programs, or any interim construction draw products.

If a broker scenario involves true construction financing, do NOT position UFF as the solution. You may discuss completed-home purchase/refi on UFF programs, or builder/realtor referral relationships for move-in-ready inventory only — not construction lending.
`.trim();

export const UNSUPPORTED_PRODUCT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bconstruction\s+(?:loan|loans|financing|mortgage|mortgages|program|programs)\b/i, label: "construction loan" },
  { pattern: /\bconstruction[\s-]to[\s-]perm(?:anent)?\b/i, label: "construction-to-perm" },
  { pattern: /\bone[\s-]time[\s-]close\s+construction\b/i, label: "one-time close construction" },
  { pattern: /\bground[\s-]up\s+construction\s+(?:loan|financing|mortgage)?\b/i, label: "ground-up construction" },
  { pattern: /\bbuilder\s+(?:construction\s+)?(?:loan|loans|financing|program|programs)\b/i, label: "builder construction loan" },
  { pattern: /\bspec\s+(?:home\s+)?construction\s+(?:loan|loans|financing)\b/i, label: "spec construction loan" },
  { pattern: /\binterim\s+construction\s+(?:loan|financing)\b/i, label: "interim construction loan" },
];

export function scanUnsupportedProducts(text: string): {
  flags: string[];
  violations: string[];
  score: number;
} {
  const flags: string[] = [];
  const violations: string[] = [];
  let score = 0;

  for (const { pattern, label } of UNSUPPORTED_PRODUCT_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(`unsupported_product:${label}`);
      violations.push(`UFF does not offer ${label} — remove or redirect to supported products`);
      score += 0.35;
    }
  }

  return { flags, violations, score: Math.min(1, score) };
}

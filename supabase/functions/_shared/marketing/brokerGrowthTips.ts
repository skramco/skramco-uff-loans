/** Research and structure broker business-development tip campaigns. */

import { callOpenAI } from "./openaiClient.ts";

export interface BrokerGrowthTip {
  tipNumber: number;
  title: string;
  strategySummary: string;
  whyItWorks: string;
  actionSteps: string[];
  uffAngle: string;
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in AI response");
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

const RESEARCH_SYSTEM_PROMPT = `You are a mortgage wholesale marketing strategist for United Fidelity Funding (UFF).

Research innovative, practical ways independent mortgage brokers and LOs grow purchase and refi business in 2025–2026. Focus on strategies that are:
- Ethical and compliance-safe (no bait-and-switch, no guaranteed approval/rates)
- Actionable for wholesale brokers working with a lender like UFF
- Mix of digital, referral, community, and operational tactics
- Not generic ("work harder") — specific, modern playbooks

Return JSON only:
{
  "tips": [
    {
      "tipNumber": 1,
      "title": "short headline",
      "strategySummary": "2-3 sentence overview",
      "whyItWorks": "1-2 sentences on psychology/market fit",
      "actionSteps": ["step 1", "step 2", "step 3"],
      "uffAngle": "1 sentence tying the tip to partnering with UFF wholesale / PRO Portal (no rate promises)"
    }
  ]
}`;

export async function researchBrokerGrowthTips(
  count = 1,
  excludeTitles: string[] = []
): Promise<BrokerGrowthTip[]> {
  const excludeBlock =
    excludeTitles.length > 0
      ? `\nDo NOT repeat or closely paraphrase these existing campaign topics:\n${excludeTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  const userPrompt = `Identify exactly ${count} distinct, innovative broker business-development strateg${count === 1 ? "y" : "ies"}.
Prioritize variety: referral partnerships, realtor/builder relationships, database reactivation, local presence, content/SEO, social proof, CRM nurture, community events, purchase-season targeting, first-time buyer education, past client systems, and digital lead quality (not volume spam).
Each tip must stand alone as its own email campaign theme.${excludeBlock}
Return JSON only.`;

  const raw = await callOpenAI(RESEARCH_SYSTEM_PROMPT, userPrompt);
  const parsed = parseJsonObject(raw);
  const tips = parsed.tips;

  if (!Array.isArray(tips) || tips.length === 0) {
    throw new Error("AI returned no broker growth tips");
  }

  return tips.slice(0, count).map((t, i) => {
    const tip = t as Record<string, unknown>;
    const steps = Array.isArray(tip.actionSteps)
      ? tip.actionSteps.map(String)
      : [];
    return {
      tipNumber: typeof tip.tipNumber === "number" ? tip.tipNumber : i + 1,
      title: String(tip.title ?? `Growth tip ${i + 1}`),
      strategySummary: String(tip.strategySummary ?? ""),
      whyItWorks: String(tip.whyItWorks ?? ""),
      actionSteps: steps,
      uffAngle: String(tip.uffAngle ?? ""),
    };
  });
}

export function buildTipCampaignUserPrompt(tip: BrokerGrowthTip): string {
  return [
    `Create ONE broker-facing email campaign for this business growth strategy:`,
    `Title: ${tip.title}`,
    `Strategy: ${tip.strategySummary}`,
    `Why it works: ${tip.whyItWorks}`,
    `Action steps for the broker: ${tip.actionSteps.join("; ")}`,
    `UFF angle: ${tip.uffAngle}`,
    ``,
    `The email should teach the strategy with a practical checklist, position UFF as a supportive wholesale partner (not consumer-facing rate advertising), and use a CTA like "Log in to PRO Portal" or "Talk to your UFF AE".`,
    `Do NOT welcome them to PRO Portal — they are existing partners.`,
    `Do NOT claim PRO Portal provides marketing tools, testimonial integration, CRM, or social proof — PRO Portal is loan origination only (uff.pro/pro-portal).`,
    `Return JSON only with all standard campaign fields.`,
  ].join("\n");
}

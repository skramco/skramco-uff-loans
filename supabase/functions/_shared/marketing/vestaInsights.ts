/** Aggregate Vesta insights — no PII. */

import { stripPIIFromText } from "./complianceGuardrails.ts";

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\bloan\s*#?\s*\d{5,}\b/i,
];

function containsPII(text: string): boolean {
  return PII_PATTERNS.some((p) => p.test(text));
}

function getVestaConfig(environment: "dev" | "production") {
  if (environment === "production") {
    return {
      apiUrl: Deno.env.get("VESTA_PROD_API_URL") || "https://uff.vesta.com/api/v1",
      apiKey: Deno.env.get("VESTA_PROD_API_KEY") || "",
      apiVersion: Deno.env.get("VESTA_PROD_API_VERSION") || "26.1",
    };
  }
  return {
    apiUrl: Deno.env.get("VESTA_DEV_API_URL") || "https://uff.beta.vesta.com/api/v1",
    apiKey: Deno.env.get("VESTA_DEV_API_KEY") || Deno.env.get("VESTA_API_KEY") || "",
    apiVersion: Deno.env.get("VESTA_DEV_API_VERSION") || Deno.env.get("VESTA_API_VERSION") || "26.1",
  };
}

export interface VestaAggregateStats {
  totalLoans: number;
  productMix: Record<string, number>;
  stageCounts: Record<string, number>;
  insights: string[];
}

export function sanitizeInsightText(text: string): string {
  let out = stripPIIFromText(text);
  if (containsPII(out)) {
    throw new Error("PII detected in insight text after sanitization");
  }
  return out;
}

export function buildInsightsFromAggregate(stats: VestaAggregateStats): string[] {
  const insights: string[] = [];

  const fha = stats.productMix["FHA"] ?? stats.productMix["fha"] ?? 0;
  const va = stats.productMix["VA"] ?? stats.productMix["va"] ?? 0;
  const conv = stats.productMix["Conventional"] ?? stats.productMix["conventional"] ?? 0;

  if (fha > va && fha > conv && fha > 0) {
    insights.push("FHA activity increased this week relative to other products.");
  }
  if (va > fha && va > 0) {
    insights.push("VA submissions are trending higher this week.");
  }

  const topStage = Object.entries(stats.stageCounts).sort((a, b) => b[1] - a[1])[0];
  if (topStage && topStage[1] > 0) {
    insights.push(`Most loans are currently in stage: ${topStage[0]}.`);
  }

  if (stats.totalLoans > 0) {
    insights.push(`${stats.totalLoans} loans in active pipeline (aggregate count).`);
  }

  return insights.map(sanitizeInsightText);
}

export async function fetchVestaAggregateInsights(
  environment: "dev" | "production" = "dev"
): Promise<string[]> {
  const { apiUrl, apiKey, apiVersion } = getVestaConfig(environment);
  if (!apiKey) {
    return ["Vesta API not configured — skipping operational insights."];
  }

  try {
    const response = await fetch(`${apiUrl}/loans?limit=100`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Api-Version": apiVersion,
      },
    });

    if (!response.ok) {
      return ["Unable to fetch aggregate Vesta data for insights."];
    }

    const data = await response.json();
    const loans = Array.isArray(data) ? data : data.loans ?? data.items ?? [];

    const productMix: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};

    for (const loan of loans) {
      const product =
        loan.loanProduct?.productType ??
        loan.productType ??
        loan.loanType ??
        "Unknown";
      const stage = loan.currentStageName ?? loan.stage ?? loan.status ?? "Unknown";
      productMix[String(product)] = (productMix[String(product)] ?? 0) + 1;
      stageCounts[String(stage)] = (stageCounts[String(stage)] ?? 0) + 1;
    }

    const stats: VestaAggregateStats = {
      totalLoans: loans.length,
      productMix,
      stageCounts,
      insights: [],
    };

    return buildInsightsFromAggregate(stats);
  } catch {
    return ["Vesta insights unavailable."];
  }
}

export async function getPerformanceSummary(
  getSetting: (key: string) => Promise<unknown>
): Promise<string> {
  const history = (await getSetting("performance_history")) as
    | Array<{ subject: string; openRate: number; clickRate: number }>
    | null;
  if (!history?.length) return "";

  const top = [...history].sort((a, b) => b.openRate - a.openRate).slice(0, 3);
  return top
    .map(
      (h, i) =>
        `${i + 1}. "${h.subject}" — ${(h.openRate * 100).toFixed(1)}% opens, ${(h.clickRate * 100).toFixed(1)}% clicks`
    )
    .join("\n");
}

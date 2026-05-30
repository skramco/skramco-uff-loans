import type { MarketingRepository } from "./repository.ts";
import type { ActorType } from "./types.ts";

export async function logMarketingAction(
  repo: MarketingRepository,
  entry: {
    campaignId?: string | null;
    action: string;
    actorType: ActorType;
    actorId?: string | null;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await repo.writeAuditLog({
    campaignId: entry.campaignId,
    action: entry.action,
    actorType: entry.actorType,
    actorId: entry.actorId,
    details: sanitizeDetails(entry.details ?? {}),
  });
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (/api[_-]?key|secret|token|password|authorization/i.test(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 5000) {
      out[k] = v.slice(0, 500) + "...[truncated]";
    } else {
      out[k] = v;
    }
  }
  return out;
}

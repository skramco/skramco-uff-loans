import type { MarketingRepository } from "./repository.ts";

export function buildIdempotencyKey(jobType: string, date: Date, timezone = "America/New_York"): string {
  const dateStr = date.toISOString().slice(0, 10);
  return `${jobType}:${dateStr}`;
}

export async function withIdempotency<T>(
  repo: MarketingRepository,
  idempotencyKey: string,
  jobType: string,
  fn: () => Promise<T>
): Promise<{ skipped: boolean; result?: T; runId?: string }> {
  const claim = await repo.claimSchedulerRun(idempotencyKey, jobType);
  if (!claim.claimed || !claim.runId) {
    return { skipped: true };
  }

  try {
    const result = await fn();
    await repo.completeSchedulerRun(claim.runId, "completed", { success: true });
    return { skipped: false, result, runId: claim.runId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await repo.completeSchedulerRun(claim.runId, "failed", { error: msg });
    throw err;
  }
}

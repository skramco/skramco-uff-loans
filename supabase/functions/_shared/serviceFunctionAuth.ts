/**
 * Service-to-service Edge Function calls.
 *
 * Supabase sb_publishable_ / sb_secret_ keys belong on the `apikey` header.
 * Sending a different key on `Authorization: Bearer` (publishable `apikey` plus
 * secret bearer) is rejected by the gateway with HTTP 401 "Conflicting API keys"
 * (UNAUTHORIZED_API_KEY_CONFLICTS) before the function runs.
 */

export function serviceFunctionHeaders(
  serviceKey: string
): Record<string, string> {
  return {
    apikey: serviceKey,
    "Content-Type": "application/json",
  };
}

export function isServiceRoleRequest(req: Request, serviceKey: string): boolean {
  if (!serviceKey) return false;
  const apiKey = req.headers.get("apikey") ?? "";
  if (apiKey === serviceKey) return true;
  const authorization = req.headers.get("Authorization") ?? "";
  return authorization === `Bearer ${serviceKey}`;
}

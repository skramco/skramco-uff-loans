import { supabase } from './supabase';

const SESSION_KEY = 'uff_rate_flow_session_id';

export function getRateFlowSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id || id.length < 8) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder.supabase.co'));
}

export type RateFlowLeadEvent =
  | 'results_view'
  | 'save_for_signup'
  | 'signup_completed'
  | 'summary_email';

/**
 * Persist a snapshot of the /start flow to Supabase (insert-only RLS).
 * Fire-and-forget; logs errors only.
 */
export async function persistRateFlowLead(
  payload: Record<string, unknown>,
  event: RateFlowLeadEvent
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const client_session_id = getRateFlowSessionId();
  const body = {
    ...payload,
    _event: event,
    _savedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('rate_flow_leads').insert({
    client_session_id,
    payload: body,
  });

  if (error) {
    console.error('[rate_flow_leads]', error.message);
  }
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface EnvironmentStatus {
  apiUrl: string;
  hasApiKey: boolean;
  apiVersion: string;
}

export interface AdminSettingsResponse {
  settings: { vesta_environment: 'dev' | 'production' };
  envStatus: {
    dev: EnvironmentStatus;
    production: EnvironmentStatus;
  };
}

async function adminFetch(body: Record<string, unknown>) {
  return fetch(`${FUNCTIONS_BASE}/admin-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
}

export async function adminLogin(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await adminFetch({ action: 'login', password });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getAdminSettings(
  password: string
): Promise<AdminSettingsResponse | null> {
  try {
    const response = await adminFetch({ action: 'getSettings', password });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function updateVestaEnvironment(
  password: string,
  environment: 'dev' | 'production'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await adminFetch({
      action: 'updateSettings',
      password,
      vesta_environment: environment,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export interface VestaSyncJobRow {
  id: string;
  loan_id: string;
  status: string;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  vesta_loan_id: string | null;
  idempotency_key: string;
  mapping_version: string;
}

export interface VestaReconciliationResponse {
  counts: {
    submittedMissingVesta: number;
    pendingJobs: number;
    failedJobs: number;
    succeededJobs: number;
  };
  recentJobs: VestaSyncJobRow[];
}

export async function getVestaReconciliation(
  password: string
): Promise<VestaReconciliationResponse | null> {
  try {
    const response = await adminFetch({
      action: 'getVestaReconciliation',
      password,
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function retryVestaSyncJob(
  password: string,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await adminFetch({
      action: 'retryVestaSyncJob',
      password,
      jobId,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function drainVestaSyncQueue(
  password: string
): Promise<{ success: boolean; drained?: number; results?: unknown[]; error?: string }> {
  try {
    const response = await adminFetch({
      action: 'drainVestaSyncQueue',
      password,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return {
      success: true,
      drained: data.drained,
      results: data.results,
    };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

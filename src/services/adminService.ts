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

export async function backfillVestaJobs(
  password: string,
  limit = 50
): Promise<{ success: boolean; backfilled?: number; error?: string }> {
  try {
    const response = await adminFetch({
      action: 'backfillVestaJobs',
      password,
      limit,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return { success: true, backfilled: data.backfilled };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function runVestaSyncCron(
  password: string
): Promise<{ success: boolean; error?: string; drained?: number; backfilled?: number }> {
  try {
    const response = await adminFetch({
      action: 'runVestaSyncCron',
      password,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return {
      success: true,
      drained: data.drained,
      backfilled: data.backfilled,
    };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export interface VestaPushLoanRow {
  id: string;
  tempLoanNumber: string | null;
  vestaLoanId: string | null;
  vestaSyncStatus: string | null;
  submittedAt: string | null;
  loanAmount: number | null;
  loanType: string | null;
  loanPurpose: string | null;
  propertyAddress: string | null;
  borrowerName: string | null;
  borrowerEmail: string | null;
  jobStatus: string | null;
  jobLastError: string | null;
  jobAttemptCount: number;
}

export type VestaPushLoanFilter = 'all' | 'needs_sync' | 'synced';

export async function listVestaPushLoans(
  password: string,
  filter: VestaPushLoanFilter = 'needs_sync'
): Promise<{ success: boolean; loans?: VestaPushLoanRow[]; error?: string }> {
  try {
    const response = await adminFetch({
      action: 'listVestaPushLoans',
      password,
      filter,
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.message };
    return { success: true, loans: data.loans || [] };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function deleteLoanApplication(
  password: string,
  loanId: string
): Promise<{
  success: boolean;
  hadVestaLoanId?: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const response = await adminFetch({
      action: 'deleteLoanApplication',
      password,
      loanId,
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'Delete failed' };
    }
    return {
      success: true,
      hadVestaLoanId: data.hadVestaLoanId,
      message: data.message,
    };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function pushLoanToVesta(
  password: string,
  loanId: string
): Promise<{
  success: boolean;
  vestaLoanId?: string | null;
  alreadySynced?: boolean;
  error?: string;
  workerMessage?: string;
}> {
  try {
    const response = await adminFetch({
      action: 'pushLoanToVesta',
      password,
      loanId,
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'Push failed' };
    }
    return {
      success: data.success !== false,
      vestaLoanId: data.vestaLoanId,
      alreadySynced: data.alreadySynced,
      workerMessage: data.worker?.message,
      error: data.success === false ? data.worker?.message : undefined,
    };
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

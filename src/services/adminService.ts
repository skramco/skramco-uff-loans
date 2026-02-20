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

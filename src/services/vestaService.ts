import { supabase } from '../lib/supabase';
import type { VestaLoanPayload } from '../types';

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export interface BorrowerLoginResult {
  success: boolean;
  loan: any | null;
  error: string | null;
  originatorEmail: string | null;
  zipMismatch: boolean;
}

export async function borrowerLogin(
  loanNumber: string,
  zipCode?: string,
  phoneLast4?: string
): Promise<BorrowerLoginResult> {
  try {
    const headers = await getAuthHeaders();
    const body: Record<string, string> = { action: 'borrowerLogin', loanNumber };
    if (zipCode) body.zipCode = zipCode;
    if (phoneLast4) body.phoneLast4 = phoneLast4;

    const response = await fetch(`${FUNCTIONS_BASE}/vesta-integration`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        loan: null,
        error: data.message || 'Unable to verify loan information.',
        originatorEmail: data.originatorEmail || null,
        zipMismatch: data.zipMismatch || false,
      };
    }

    return {
      success: true,
      loan: data.loan,
      error: null,
      originatorEmail: null,
      zipMismatch: false,
    };
  } catch (err: any) {
    return {
      success: false,
      loan: null,
      error: err.message || 'Network error connecting to Vesta',
      originatorEmail: null,
      zipMismatch: false,
    };
  }
}

export async function createLoanInVesta(payload: VestaLoanPayload): Promise<{ vestaLoanId: string | null; error: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_BASE}/vesta-integration`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'createLoan',
        payload,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { vestaLoanId: null, error: errorData.message || `Failed to create loan in Vesta (${response.status})` };
    }

    const data = await response.json();
    return { vestaLoanId: data.vestaLoanId || null, error: null };
  } catch (err: any) {
    return { vestaLoanId: null, error: err.message || 'Network error connecting to Vesta' };
  }
}

export async function updateLoanInVesta(vestaLoanId: string, payload: Partial<VestaLoanPayload>): Promise<{ success: boolean; error: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_BASE}/vesta-integration`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'updateLoan',
        vestaLoanId,
        payload,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to update loan in Vesta (${response.status})` };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to Vesta' };
  }
}

export async function fetchLoanConditions(
  loanId: string,
  statuses?: string[]
): Promise<{ conditions: any[] | null; error: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_BASE}/vesta-integration`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'fetchConditions',
        loanId,
        statuses,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { conditions: null, error: errorData.message || `Failed to fetch conditions (${response.status})` };
    }

    const data = await response.json();
    return { conditions: data.conditions || [], error: null };
  } catch (err: any) {
    return { conditions: null, error: err.message || 'Network error fetching conditions' };
  }
}

export async function sendConditionQuestion(payload: {
  borrowerName: string;
  borrowerEmail: string;
  loanOfficerName: string;
  loanOfficerEmail: string;
  loanNumber: string;
  propertyAddress: string;
  conditionName: string;
  conditionInstructions: string;
  conditionTiming: string;
  conditionStatus: string;
  question: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${FUNCTIONS_BASE}/send-condition-question`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Failed to send question' };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error sending question' };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadDocumentToVesta(
  vestaLoanId: string,
  file: File,
  _documentType: string
): Promise<{ success: boolean; documentId: string | null; error: string | null }> {
  try {
    const headers = await getAuthHeaders();
    const base64Data = await fileToBase64(file);

    const response = await fetch(`${FUNCTIONS_BASE}/vesta-integration`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'uploadDocument',
        vestaLoanId,
        fileName: file.name,
        fileContentType: file.type || 'application/octet-stream',
        fileBase64: base64Data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, documentId: null, error: errorData.message || 'Failed to upload document to Vesta' };
    }

    const data = await response.json();
    return { success: true, documentId: data.documentId || null, error: null };
  } catch (err: any) {
    return { success: false, documentId: null, error: err.message || 'Network error uploading to Vesta' };
  }
}

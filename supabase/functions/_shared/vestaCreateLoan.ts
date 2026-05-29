/**
 * Shared Vesta loan-create helpers for edge functions.
 * POST /loans body follows docs/vesta/openapi.json Loan schema.
 * Full audit payload stays in vesta_sync_jobs.payload_json.
 */

import {
  buildLoanProductFromUiLoanType,
  mapUiLoanPurposeToVesta,
  mapUiPropertyTypeToVesta,
} from "./vestaEnums.ts";

export interface VestaConfig {
  apiUrl: string;
  apiKey: string;
  apiVersion: string;
}

export const VESTA_MAX_SYNC_ATTEMPTS = 5;

/** LoanType enum — always Mortgage for residential apps. */
export const VESTA_LOAN_TYPE = "Mortgage";

export function vestaLoansCollectionUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/+$/, "")}/loans`;
}

function toNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function str(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const s = val.trim();
  return s || undefined;
}

function urlaSection(
  payload: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const urla = payload.urlaMapped as Record<string, unknown> | undefined;
  const section = urla?.[key];
  return section && typeof section === "object"
    ? (section as Record<string, unknown>)
    : {};
}

function buildBorrower(
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const personal = urlaSection(payload, "personalInfo");
  const firstName = str(payload.borrowerFirstName) ?? str(personal.firstName);
  const lastName = str(payload.borrowerLastName) ?? str(personal.lastName);
  const emailAddress = str(payload.borrowerEmail) ?? str(personal.email);
  const phoneNumber = str(payload.borrowerPhone) ?? str(personal.phone);

  if (!firstName && !lastName && !emailAddress && !phoneNumber) {
    return undefined;
  }

  const borrower: Record<string, unknown> = {};
  if (firstName) borrower.firstName = firstName;
  if (lastName) borrower.lastName = lastName;
  if (emailAddress) borrower.emailAddress = emailAddress;
  if (phoneNumber) {
    // Borrower phone is modeled as TelephoneNumber[] in Vesta.
    borrower.phoneNumbers = [{ type: "Mobile", number: phoneNumber }];
  }
  return borrower;
}

function buildSubjectPropertyAddress(
  prop: Record<string, unknown>,
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const line =
    str(prop.address) ??
    str(payload.propertyAddress)?.split(",")[0]?.trim();
  const city = str(prop.city);
  const state = str(prop.state);
  const zipCode = str(prop.zip);

  if (!line && !city && !state && !zipCode) return undefined;

  const address: Record<string, unknown> = {};
  if (line) address.line = line;
  if (city) address.city = city;
  if (state) address.state = state;
  if (zipCode) address.zipCode = zipCode;
  return address;
}

function buildSubjectProperty(
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const prop = urlaSection(payload, "property");
  const address = buildSubjectPropertyAddress(prop, payload);
  const estimatedValueAmount =
    toNumber(prop.propertyValue) ?? toNumber(payload.propertyValue);
  const propertyType = mapUiPropertyTypeToVesta(prop.propertyType);
  const numberOfUnits = toNumber(prop.unitsCount);

  if (!address && estimatedValueAmount == null && !propertyType) {
    return undefined;
  }

  const subjectProperty: Record<string, unknown> = {};
  if (propertyType) subjectProperty.propertyType = propertyType;
  if (estimatedValueAmount != null) {
    subjectProperty.estimatedValueAmount = estimatedValueAmount;
  }
  if (numberOfUnits != null && numberOfUnits >= 1) {
    subjectProperty.numberOfUnits = numberOfUnits;
  }
  if (address) subjectProperty.address = address;
  return subjectProperty;
}

/**
 * Build POST /loans body per OpenAPI Loan schema (borrowers, subjectProperty, loanProduct).
 */
export function buildVestaCreateLoanHttpBody(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    loanType: VESTA_LOAN_TYPE,
  };

  const loanPurpose = mapUiLoanPurposeToVesta(payload.loanPurpose);
  if (loanPurpose) body.loanPurpose = loanPurpose;

  const loanAmount = toNumber(payload.loanAmount);
  if (loanAmount != null) body.loanAmount = loanAmount;

  const loanNumber = str(payload.loanNumber);
  if (loanNumber) body.loanNumber = loanNumber;

  const borrower = buildBorrower(payload);
  if (borrower) body.borrowers = [borrower];

  const subjectProperty = buildSubjectProperty(payload);
  if (subjectProperty) body.subjectProperty = subjectProperty;

  const loanProduct = buildLoanProductFromUiLoanType(payload.loanType);
  if (loanProduct) body.loanProduct = loanProduct;

  return body;
}

export async function getVestaConfig(
  supabaseUrl: string,
  serviceKey: string
): Promise<VestaConfig> {
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase
      .from("admin_settings")
      .select("vesta_environment")
      .eq("id", 1)
      .maybeSingle();

    const env = data?.vesta_environment || "dev";

    if (env === "production") {
      return {
        apiUrl:
          Deno.env.get("VESTA_PROD_API_URL") ||
          "https://uff.vesta.com/api/v1",
        apiKey: Deno.env.get("VESTA_PROD_API_KEY") || "",
        apiVersion: Deno.env.get("VESTA_PROD_API_VERSION") || "26.1",
      };
    }

    return {
      apiUrl:
        Deno.env.get("VESTA_DEV_API_URL") ||
        "https://uff.beta.vesta.com/api/v1",
      apiKey:
        Deno.env.get("VESTA_DEV_API_KEY") ||
        Deno.env.get("VESTA_API_KEY") ||
        "",
      apiVersion:
        Deno.env.get("VESTA_DEV_API_VERSION") ||
        Deno.env.get("VESTA_API_VERSION") ||
        "26.1",
    };
  } catch {
    return {
      apiUrl:
        Deno.env.get("VESTA_API_URL") ||
        "https://uff.beta.vesta.com/api/v1",
      apiKey: Deno.env.get("VESTA_API_KEY") || "",
      apiVersion: Deno.env.get("VESTA_API_VERSION") || "26.1",
    };
  }
}

export interface CreateLoanResult {
  ok: boolean;
  status: number;
  body: string;
  /** Vesta loan GUID (loanId / id) — used for API paths. */
  vestaId: string | null;
  /** Borrower-facing loan number from Vesta (loanNumber). */
  vestaLoanNumber: string | null;
}

function parseCreateLoanResponse(text: string): {
  vestaId: string | null;
  vestaLoanNumber: string | null;
} {
  try {
    const data = JSON.parse(text);
    const vestaId =
      (typeof data.loanId === "string" && data.loanId) ||
      (typeof data.id === "string" && data.id) ||
      null;
    const vestaLoanNumber =
      data.loanNumber != null && data.loanNumber !== ""
        ? String(data.loanNumber)
        : null;
    return { vestaId, vestaLoanNumber };
  } catch {
    const trimmed = text.replace(/^"|"$/g, "").trim();
    if (!trimmed) return { vestaId: null, vestaLoanNumber: null };
    // Bare GUID string response
    if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
      return { vestaId: trimmed, vestaLoanNumber: null };
    }
    return { vestaId: null, vestaLoanNumber: trimmed };
  }
}

export async function postCreateLoan(
  config: VestaConfig,
  payload: Record<string, unknown>
): Promise<CreateLoanResult> {
  if (!config.apiUrl || !config.apiKey) {
    return {
      ok: false,
      status: 503,
      body: "Vesta not configured",
      vestaId: null,
      vestaLoanNumber: null,
    };
  }

  const httpBody = buildVestaCreateLoanHttpBody(payload);

  const response = await fetch(vestaLoansCollectionUrl(config.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${config.apiKey}`,
      "x-Api-Version": config.apiVersion,
    },
    body: JSON.stringify(httpBody),
  });

  const text = await response.text();
  const parsed = response.ok
    ? parseCreateLoanResponse(text)
    : { vestaId: null, vestaLoanNumber: null };

  return {
    ok: response.ok,
    status: response.status,
    body: text,
    vestaId: parsed.vestaId,
    vestaLoanNumber: parsed.vestaLoanNumber,
  };
}

export function computeNextRetryAt(attemptCount: number): string {
  const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

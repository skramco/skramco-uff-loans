import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { postCreateLoan } from "../_shared/vestaCreateLoan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VestaConfig {
  apiUrl: string;
  apiKey: string;
  apiVersion: string;
}

async function getVestaConfig(): Promise<VestaConfig> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: true, message }, status);
}

/** apiUrl is typically .../api/v1 — loan collection is /loans not /api/loans */
function vestaLoansCollectionUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/+$/, "")}/loans`;
}

function vestaLoanItemUrl(apiUrl: string, vestaLoanId: string): string {
  return `${apiUrl.replace(/\/+$/, "")}/loans/${encodeURIComponent(vestaLoanId)}`;
}

async function handleCreateLoan(config: VestaConfig, payload: any) {
  if (!config.apiUrl || !config.apiKey) {
    return jsonResponse({
      vestaLoanId: null,
      message:
        "Vesta integration not configured. Loan saved locally.",
    });
  }

  try {
    const result = await postCreateLoan(config, payload as Record<string, unknown>);

    if (!result.ok) {
      return errorResponse(
        `Vesta API error: ${result.body}`,
        result.status >= 400 ? result.status : 502
      );
    }

    return jsonResponse({
      vestaLoanId: result.vestaId,
      vestaLoanNumber: result.vestaLoanNumber,
      message: "Loan created in Vesta successfully",
    });
  } catch (err: any) {
    return errorResponse(`Vesta connection error: ${err.message}`, 502);
  }
}

async function handleUpdateLoan(
  config: VestaConfig,
  vestaLoanId: string,
  payload: any
) {
  if (!config.apiUrl || !config.apiKey) {
    return jsonResponse({
      success: true,
      message:
        "Vesta integration not configured. Update saved locally only.",
    });
  }

  try {
    const response = await fetch(
      vestaLoanItemUrl(config.apiUrl, vestaLoanId),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${config.apiKey}`,
          "x-Api-Version": config.apiVersion,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(
        `Vesta API error: ${errorText}`,
        response.status
      );
    }

    return jsonResponse({
      success: true,
      message: "Loan updated in Vesta",
    });
  } catch (err: any) {
    return errorResponse(`Vesta connection error: ${err.message}`, 502);
  }
}

async function handleBorrowerLogin(
  config: VestaConfig,
  loanNumber: string,
  zipCode?: string,
  phoneLast4?: string
) {
  if (!config.apiUrl || !config.apiKey) {
    return errorResponse("Vesta integration not configured.", 503);
  }

  if (!zipCode && !phoneLast4) {
    return errorResponse(
      "Please provide a property zip code or the last 4 digits of your mobile phone number.",
      400
    );
  }

  const getHeaders = {
    Accept: "application/json",
    Authorization: `Token ${config.apiKey}`,
    "x-Api-Version": config.apiVersion,
  };

  const baseUrl = config.apiUrl.replace(/\/+$/, "");

  try {
    const lookupUrl = `${baseUrl}/loans/by-number/${encodeURIComponent(loanNumber)}`;
    const lookupResponse = await fetch(lookupUrl, {
      method: "GET",
      headers: getHeaders,
    });

    if (!lookupResponse.ok) {
      if (lookupResponse.status === 404) {
        return errorResponse(
          "Sorry, we could not find a loan with that number. Please check the number and try again.",
          404
        );
      }
      const errorText = await lookupResponse.text();
      return errorResponse(
        `Vesta lookup error (${lookupResponse.status}): ${errorText} [URL: ${lookupUrl}]`,
        lookupResponse.status
      );
    }

    const lookupText = await lookupResponse.text();
    let loanId: string;

    try {
      const lookupJson = JSON.parse(lookupText);
      loanId = lookupJson?.id || lookupJson?.loanId || lookupJson;
    } catch {
      loanId = lookupText.replace(/^"|"$/g, "").trim();
    }

    if (!loanId) {
      return errorResponse(
        `Could not resolve loan ID from loan number. Response: ${lookupText}`,
        400
      );
    }

    const loanUrl = `${baseUrl}/loans/${encodeURIComponent(loanId)}`;
    const loanResponse = await fetch(loanUrl, {
      method: "GET",
      headers: getHeaders,
    });

    if (!loanResponse.ok) {
      const errorText = await loanResponse.text();
      return errorResponse(
        `Vesta loan error (${loanResponse.status}): ${errorText} [URL: ${loanUrl}]`,
        loanResponse.status
      );
    }

    const loan = await loanResponse.json();

    const originatorEmail = loan?.loanOriginator?.email || "";
    const originatorFullName = loan?.loanOriginator?.fullName || "";

    let zipMatched = false;
    let phoneMatched = false;

    if (zipCode) {
      const loanZip = loan?.subjectProperty?.address?.zipCode || "";
      const normalizedLoanZip = loanZip.toString().trim().split("-")[0];
      const normalizedInputZip = zipCode.toString().trim().split("-")[0];
      zipMatched =
        normalizedLoanZip.length > 0 &&
        normalizedLoanZip === normalizedInputZip;
    }

    if (phoneLast4) {
      const borrower = loan?.borrowers?.[0];
      const mobileEntry = borrower?.phoneNumbers?.find(
        (p: { type: string }) =>
          p.type?.toLowerCase() === "mobile" ||
          p.type?.toLowerCase() === "cell"
      );
      if (mobileEntry?.number) {
        const digitsOnly = mobileEntry.number.replace(/\D/g, "");
        const actualLast4 = digitsOnly.slice(-4);
        phoneMatched = actualLast4 === phoneLast4.trim();
      }
    }

    if (!zipMatched && !phoneMatched) {
      return jsonResponse(
        {
          error: true,
          zipMismatch: true,
          message: `Sorry, the information you provided does not match our records. Please try again or contact your loan officer${originatorFullName ? ` ${originatorFullName}` : ""} via email at ${originatorEmail}`,
          originatorEmail,
          originatorFullName,
        },
        401
      );
    }

    return jsonResponse({
      success: true,
      loan,
    });
  } catch (err: any) {
    return errorResponse(`Vesta connection error: ${err.message}`, 502);
  }
}

async function handleFetchConditions(
  config: VestaConfig,
  loanId: string,
  statuses?: string[],
  categories?: string[]
) {
  if (!config.apiUrl || !config.apiKey) {
    return errorResponse("Vesta integration not configured.", 503);
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, "");

  try {
    const conditionsUrl = new URL(
      `${baseUrl}/loans/${encodeURIComponent(loanId)}/objective-conditions`
    );
    const cats = categories?.length ? categories : ["Borrower"];
    for (const cat of cats) {
      conditionsUrl.searchParams.append("categories", cat);
    }
    if (statuses && statuses.length > 0) {
      for (const s of statuses) {
        conditionsUrl.searchParams.append("statuses", s);
      }
    }

    const response = await fetch(conditionsUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Token ${config.apiKey}`,
        "x-Api-Version": config.apiVersion,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(
        `Vesta conditions error (${response.status}): ${errorText}`,
        response.status
      );
    }

    const conditions = await response.json();
    return jsonResponse({ conditions });
  } catch (err: any) {
    return errorResponse(`Vesta connection error: ${err.message}`, 502);
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const vestaJsonHeaders = (config: VestaConfig) => ({
  Accept: "application/json",
  Authorization: `Token ${config.apiKey}`,
  "x-Api-Version": config.apiVersion,
});

/**
 * Vesta contract for borrower uploads:
 * 1) GET /admin-config → defaultProcessVersionId
 * 2) GET /admin-config/{defaultProcessVersionId}/document-types
 * 3) Use document type where name === "Uncategorized"
 */
async function resolveUncategorizedDocumentTypeId(
  config: VestaConfig,
  baseUrl: string
): Promise<{ documentTypeId: string; documentTypeName: string } | { error: string; status: number }> {
  const adminConfigUrl = `${baseUrl}/admin-config`;
  const adminConfigRes = await fetch(adminConfigUrl, {
    method: "GET",
    headers: vestaJsonHeaders(config),
  });

  if (!adminConfigRes.ok) {
    const t = await adminConfigRes.text();
    return {
      error: `Could not load admin-config (${adminConfigRes.status}): ${t}`,
      status: adminConfigRes.status,
    };
  }

  const adminConfig = await adminConfigRes.json();
  const processVersionId = adminConfig?.defaultProcessVersionId;

  if (!processVersionId || typeof processVersionId !== "string") {
    return {
      error:
        "Expected admin-config.defaultProcessVersionId from Vesta.",
      status: 422,
    };
  }

  const typesUrl = `${baseUrl}/admin-config/${encodeURIComponent(processVersionId)}/document-types`;
  const typesRes = await fetch(typesUrl, {
    method: "GET",
    headers: vestaJsonHeaders(config),
  });

  if (!typesRes.ok) {
    const t = await typesRes.text();
    return {
      error: `Could not load document types (${typesRes.status}): ${t}`,
      status: typesRes.status,
    };
  }

  const docTypesPayload = await typesRes.json();
  const list: unknown[] = Array.isArray(docTypesPayload)
    ? docTypesPayload
    : Array.isArray(docTypesPayload?.items)
      ? docTypesPayload.items
      : Array.isArray(docTypesPayload?.documentTypes)
        ? docTypesPayload.documentTypes
        : [];

  const uncategorized = list.find((d: unknown) => {
    if (!d || typeof d !== "object") return false;
    const o = d as Record<string, unknown>;
    const name = o.name;
    return typeof name === "string" && name.trim() === "Uncategorized";
  }) as Record<string, unknown> | undefined;

  const id = uncategorized?.id;
  if (!id || typeof id !== "string") {
    return {
      error:
        'Expected document type named "Uncategorized" in admin-config document-types list.',
      status: 422,
    };
  }

  return { documentTypeId: id, documentTypeName: "Uncategorized" };
}

const BORROWER_NOTE_PREFIX = "[Borrower Portal]";

function formatBorrowerPortalNote(
  message: string,
  extras?: { conditionLabel?: string; fileName?: string }
): string {
  const parts = [BORROWER_NOTE_PREFIX];
  if (extras?.conditionLabel) parts.push(`Condition: ${extras.conditionLabel}`);
  if (extras?.fileName) parts.push(`Document: ${extras.fileName}`);
  parts.push("", message.trim());
  return parts.join("\n");
}

async function postLoanNote(
  config: VestaConfig,
  loanId: string,
  body: {
    message: string;
    objectiveConditionId?: string;
    objectiveTaskId?: string;
    documentId?: string;
  }
): Promise<{ ok: boolean; error?: string; status?: number }> {
  if (!config.apiUrl || !config.apiKey) {
    return { ok: false, error: "Vesta integration not configured.", status: 503 };
  }

  const noteMessage = body.message?.trim();
  if (!noteMessage) {
    return { ok: false, error: "message is required", status: 400 };
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, "");
  const payload: Record<string, string> = {
    message: noteMessage.startsWith(BORROWER_NOTE_PREFIX)
      ? noteMessage
      : formatBorrowerPortalNote(noteMessage),
  };
  if (body.objectiveConditionId) {
    payload.objectiveConditionId = body.objectiveConditionId;
  }
  if (body.objectiveTaskId) payload.objectiveTaskId = body.objectiveTaskId;
  if (body.documentId) payload.documentId = body.documentId;

  const response = await fetch(
    `${baseUrl}/loans/${encodeURIComponent(loanId)}/notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${config.apiKey}`,
        "x-Api-Version": config.apiVersion,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      error: `Vesta note error (${response.status}): ${errorText}`,
      status: response.status,
    };
  }

  return { ok: true };
}

async function handleCreateLoanNote(
  config: VestaConfig,
  loanId: string,
  body: {
    message: string;
    objectiveConditionId?: string;
    objectiveTaskId?: string;
    documentId?: string;
  }
) {
  const result = await postLoanNote(config, loanId, body);
  if (!result.ok) {
    return errorResponse(result.error || "Failed to create note", result.status || 502);
  }
  return jsonResponse({ success: true, message: "Note added to loan" });
}

async function handleUploadDocument(
  config: VestaConfig,
  vestaLoanId: string,
  fileBase64: string,
  fileName: string,
  fileContentType: string,
  options?: {
    documentTypeId?: string;
    documentRequiredTaskIds?: string[];
    note?: string;
    objectiveConditionId?: string;
    objectiveTaskId?: string;
    conditionLabel?: string;
    borrowerId?: string;
  }
) {
  if (!config.apiUrl || !config.apiKey) {
    return jsonResponse({
      success: true,
      documentId: null,
      message:
        "Vesta integration not configured. Document stored locally only.",
    });
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, "");
  const uploadUrl = `${baseUrl}/loans/${encodeURIComponent(vestaLoanId)}/documents`;

  try {
    // Per Vesta dev contract, always upload as "Uncategorized" resolved from admin-config.
    const resolved = await resolveUncategorizedDocumentTypeId(config, baseUrl);
    if ("error" in resolved) {
      return errorResponse(resolved.error, resolved.status);
    }
    const documentTypeId = resolved.documentTypeId;
    const documentTypeName = resolved.documentTypeName;

    const fileBytes = base64ToUint8Array(fileBase64);

    const metadata: Record<string, unknown> = {
      documentTypeId,
      status: "Uploaded",
    };
    // Vesta dev behavior: Uncategorized document uploads must not send associatedEntities.
    const isUncategorized = documentTypeName === "Uncategorized";
    if (!isUncategorized) {
      const associatedEntities: Array<{ entityId: string; entityType: "Borrower" | "Loan" }> = [];
      if (options?.borrowerId) {
        associatedEntities.push({
          entityId: options.borrowerId,
          entityType: "Borrower",
        });
      }
      associatedEntities.push({
        entityId: vestaLoanId,
        entityType: "Loan",
      });
      metadata.associatedEntities = associatedEntities;
    }
    if (options?.documentRequiredTaskIds?.length) {
      metadata.documentRequiredTaskIds = options.documentRequiredTaskIds;
    }

    const buildFormData = (uploadMetadata: Record<string, unknown>) => {
      const fd = new FormData();
      fd.append(
        "metadata",
        new Blob([JSON.stringify(uploadMetadata)], { type: "application/json" }),
      );
      fd.append(
        "filename",
        new Blob([fileBytes], { type: fileContentType }),
        fileName
      );
      return fd;
    };

    const uploadHeaders = {
      Authorization: `Token ${config.apiKey}`,
      "x-Api-Version": config.apiVersion,
    };
    let response = await fetch(uploadUrl, {
      method: "POST",
      headers: uploadHeaders,
      body: buildFormData(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const canRetryWithoutTaskLink =
        Array.isArray(options?.documentRequiredTaskIds) &&
        options.documentRequiredTaskIds.length > 0 &&
        errorText.includes("objectiveTaskIds were invalid");

      const canRetryBorrowerOnlyEntity =
        Boolean(options?.borrowerId) &&
        errorText.includes("Invalid associated entity") &&
        Array.isArray(metadata.associatedEntities);

      if (!canRetryWithoutTaskLink && !canRetryBorrowerOnlyEntity) {
        return errorResponse(`Vesta API error: ${errorText}`, response.status);
      }

      // Fallback 1: upload without documentRequiredTaskIds when Vesta rejects task linkage.
      if (canRetryWithoutTaskLink) {
        delete metadata.documentRequiredTaskIds;
      }
      // Fallback 2: borrower-only association for borrower-scoped document types.
      if (canRetryBorrowerOnlyEntity && options?.borrowerId) {
        metadata.associatedEntities = [
          {
            entityId: options.borrowerId,
            entityType: "Borrower",
          },
        ];
      }

      response = await fetch(uploadUrl, {
        method: "POST",
        headers: uploadHeaders,
        body: buildFormData(metadata),
      });
      if (!response.ok) {
        const fallbackError = await response.text();
        return errorResponse(`Vesta API error: ${fallbackError}`, response.status);
      }
    }

    const responseText = await response.text();
    let documentId = null;
    try {
      const parsed = JSON.parse(responseText);
      documentId =
        typeof parsed === "string"
          ? parsed
          : parsed.documentId || parsed.id || null;
    } catch {
      documentId = responseText.replace(/^"|"$/g, "").trim() || null;
    }

    if (options?.note?.trim()) {
      const noteResult = await postLoanNote(config, vestaLoanId, {
        message: formatBorrowerPortalNote(options.note, {
          conditionLabel: options.conditionLabel,
          fileName,
        }),
        objectiveConditionId: options.objectiveConditionId,
        objectiveTaskId: options.objectiveTaskId,
        documentId: documentId || undefined,
      });
      if (!noteResult.ok) {
        return errorResponse(
          noteResult.error || "Document uploaded but note failed",
          noteResult.status || 502
        );
      }
    }

    return jsonResponse({
      success: true,
      documentId,
      message: "Document uploaded to Vesta",
    });
  } catch (err: any) {
    return errorResponse(`Vesta connection error: ${err.message}`, 502);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const config = await getVestaConfig();
    const { action, vestaLoanId, payload, loanNumber, zipCode, phoneLast4 } =
      body;

    switch (action) {
      case "borrowerLogin":
        if (!loanNumber) return errorResponse("loanNumber is required");
        if (!zipCode && !phoneLast4)
          return errorResponse("zipCode or phoneLast4 is required");
        return await handleBorrowerLogin(
          config,
          loanNumber,
          zipCode,
          phoneLast4
        );
      case "createLoan":
        return await handleCreateLoan(config, payload);
      case "updateLoan":
        if (!vestaLoanId) return errorResponse("vestaLoanId is required");
        return await handleUpdateLoan(config, vestaLoanId, payload);
      case "fetchConditions":
        if (!body.loanId) return errorResponse("loanId is required");
        return await handleFetchConditions(
          config,
          body.loanId,
          body.statuses,
          body.categories
        );
      case "createLoanNote":
        if (!body.loanId) return errorResponse("loanId is required");
        if (!body.message) return errorResponse("message is required");
        return await handleCreateLoanNote(config, body.loanId, {
          message: body.message,
          objectiveConditionId: body.objectiveConditionId,
          objectiveTaskId: body.objectiveTaskId,
          documentId: body.documentId,
        });
      case "uploadDocument":
        if (!vestaLoanId || !body.fileBase64 || !body.fileName)
          return errorResponse(
            "vestaLoanId, fileBase64, and fileName are required"
          );
        return await handleUploadDocument(
          config,
          vestaLoanId,
          body.fileBase64,
          body.fileName,
          body.fileContentType || "application/octet-stream",
          {
            documentTypeId: body.documentTypeId,
            documentRequiredTaskIds: body.documentRequiredTaskIds,
            note: body.note,
            objectiveConditionId: body.objectiveConditionId,
            objectiveTaskId: body.objectiveTaskId,
            conditionLabel: body.conditionLabel,
            borrowerId: body.borrowerId,
          }
        );
      case "getLoan":
        if (!vestaLoanId) return errorResponse("vestaLoanId is required");
        if (!config.apiUrl || !config.apiKey) {
          return errorResponse("Vesta integration not configured.", 503);
        }
        try {
          const loanRes = await fetch(
            vestaLoanItemUrl(config.apiUrl, vestaLoanId),
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Token ${config.apiKey}`,
                "x-Api-Version": config.apiVersion,
              },
            }
          );
          if (!loanRes.ok) {
            const errorText = await loanRes.text();
            return errorResponse(
              `Vesta API error: ${errorText}`,
              loanRes.status
            );
          }
          const loan = await loanRes.json();
          return jsonResponse({ loan });
        } catch (err: any) {
          return errorResponse(`Vesta connection error: ${err.message}`, 502);
        }
      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err: any) {
    return errorResponse(`Server error: ${err.message}`, 500);
  }
});

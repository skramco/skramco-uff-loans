import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function handleCreateLoan(config: VestaConfig, payload: any) {
  if (!config.apiUrl || !config.apiKey) {
    return jsonResponse({
      vestaLoanId: null,
      message:
        "Vesta integration not configured. Loan saved locally.",
    });
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/loans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${config.apiKey}`,
        "x-Api-Version": config.apiVersion,
      },
      body: JSON.stringify({
        borrowerFirstName: payload.borrowerFirstName,
        borrowerLastName: payload.borrowerLastName,
        borrowerEmail: payload.borrowerEmail,
        loanAmount: payload.loanAmount,
        propertyAddress: payload.propertyAddress,
        loanType: payload.loanType,
        loanPurpose: payload.loanPurpose,
        propertyValue: payload.propertyValue,
        applicationData: payload.applicationData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(
        `Vesta API error: ${errorText}`,
        response.status
      );
    }

    const data = await response.json();
    return jsonResponse({
      vestaLoanId: data.loanId || data.id || null,
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
      `${config.apiUrl}/api/loans/${vestaLoanId}`,
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
  statuses?: string[]
) {
  if (!config.apiUrl || !config.apiKey) {
    return errorResponse("Vesta integration not configured.", 503);
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, "");

  try {
    const conditionsUrl = new URL(
      `${baseUrl}/loans/${encodeURIComponent(loanId)}/objective-conditions`
    );
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

async function handleUploadDocument(
  config: VestaConfig,
  vestaLoanId: string,
  fileBase64: string,
  fileName: string,
  fileContentType: string
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

  try {
    const fileBytes = base64ToUint8Array(fileBase64);

    const metadata = JSON.stringify({
      associatedEntities: [
        {
          entityId: vestaLoanId,
          entityType: "Loan",
        },
      ],
      documentTypeId: "b16f5ae4-331e-4c46-85fa-537d8062a7af",
      status: "Uploaded",
    });

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([metadata], { type: "application/json" }),
    );
    formData.append(
      "filename",
      new Blob([fileBytes], { type: fileContentType }),
      fileName
    );

    const response = await fetch(
      `${baseUrl}/loans/${encodeURIComponent(vestaLoanId)}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${config.apiKey}`,
          "x-Api-Version": config.apiVersion,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return errorResponse(
        `Vesta API error: ${errorText}`,
        response.status
      );
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
          body.statuses
        );
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
          body.fileContentType || "application/octet-stream"
        );
      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err: any) {
    return errorResponse(`Server error: ${err.message}`, 500);
  }
});

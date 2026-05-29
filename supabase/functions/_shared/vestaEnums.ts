/**
 * Maps application form values to Vesta API enums (docs/vesta/openapi.json).
 *
 * Top-level `loanType` is always "Mortgage" (LoanType enum).
 * Application product (Conventional/FHA/Jumbo) maps to `loanProduct`.
 */

/** Application loan type → loanProduct.mortgageType (MortgageType enum) */
export const UI_MORTGAGE_TYPE_TO_VESTA: Record<string, string> = {
  Conventional: "Conventional",
  FHA: "FHA",
  VA: "VA",
  USDA: "USDA",
  Jumbo: "Conventional",
};

/** Application loan purpose → top-level loanPurpose (LoanPurpose: Purchase | Refinance) */
export const UI_LOAN_PURPOSE_TO_VESTA: Record<string, string> = {
  Purchase: "Purchase",
  Refinance: "Refinance",
  "Cash-Out Refinance": "Refinance",
};

/** Application property type → subjectProperty.propertyType (PropertyType enum) */
export const UI_PROPERTY_TYPE_TO_VESTA: Record<string, string> = {
  "Single Family": "SingleFamily",
  Condominium: "Condominium",
  Condo: "Condominium",
  Townhouse: "SingleFamily",
  "2-4 Unit": "TwoToFourUnitProperty",
  "Multi-Family (2-4)": "TwoToFourUnitProperty",
  "Manufactured Home": "ManufacturedHome",
};

export function mapUiMortgageTypeToVesta(ui: unknown): string | undefined {
  if (typeof ui !== "string" || !ui.trim()) return undefined;
  const key = ui.trim();
  if (key === "Jumbo") return undefined;
  return UI_MORTGAGE_TYPE_TO_VESTA[key];
}

export function mapUiMortgageSizeTypeToVesta(ui: unknown): string | undefined {
  if (typeof ui === "string" && ui.trim() === "Jumbo") return "Jumbo";
  return undefined;
}

export function mapUiLoanPurposeToVesta(ui: unknown): string | undefined {
  if (typeof ui !== "string" || !ui.trim()) return undefined;
  const key = ui.trim();
  return UI_LOAN_PURPOSE_TO_VESTA[key] ?? key;
}

export function mapUiPropertyTypeToVesta(ui: unknown): string | undefined {
  if (typeof ui !== "string" || !ui.trim()) return undefined;
  const key = ui.trim();
  return UI_PROPERTY_TYPE_TO_VESTA[key] ?? key;
}

/** Build loanProduct per OpenAPI LoanProduct (mortgageType, mortgageSizeType). */
export function buildLoanProductFromUiLoanType(
  ui: unknown
): Record<string, string> | undefined {
  if (typeof ui !== "string" || !ui.trim()) return undefined;

  const product: Record<string, string> = {};
  const mortgageType = mapUiMortgageTypeToVesta(ui);
  const mortgageSizeType = mapUiMortgageSizeTypeToVesta(ui);

  if (mortgageType) product.mortgageType = mortgageType;
  if (mortgageSizeType) {
    product.mortgageSizeType = mortgageSizeType;
    if (!product.mortgageType) product.mortgageType = "Conventional";
  }

  return Object.keys(product).length > 0 ? product : undefined;
}

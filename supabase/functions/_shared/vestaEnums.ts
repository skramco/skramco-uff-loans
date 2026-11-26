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

/**
 * LoanPurpose is only Purchase | Refinance. Cash-out is a separate field
 * (RefinanceCashOutDeterminationType).
 */
export function mapUiRefinanceCashOutDetermination(
  ui: unknown
): "CashOut" | "NoOrLimitedCashOut" | undefined {
  if (typeof ui !== "string") return undefined;
  const key = ui.trim();
  if (key === "Cash-Out Refinance") return "CashOut";
  if (key === "Refinance") return "NoOrLimitedCashOut";
  return undefined;
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

function compactEnumKey(ui: unknown): string | undefined {
  if (typeof ui !== "string") return undefined;
  const key = ui.toLowerCase().replace(/[^a-z0-9]/g, "");
  return key || undefined;
}

const UI_CITIZENSHIP_TO_VESTA: Record<string, string> = {
  uscitizen: "USCitizen",
  permanentresident: "PermanentResidentAlien",
  permanentresidentalien: "PermanentResidentAlien",
  nonpermanentresident: "NonPermanentResidentAlien",
  nonpermanentresidentalien: "NonPermanentResidentAlien",
  nonresidentalien: "NonResidentAlien",
};

const UI_MARITAL_STATUS_TO_VESTA: Record<string, string> = {
  married: "Married",
  separated: "Separated",
  unmarried: "Unmarried",
  single: "Unmarried",
  divorced: "Unmarried",
  widowed: "Unmarried",
};

/** Address.occupancyType is housing (Own / Rent), not subject-property usage. */
const UI_HOUSING_STATUS_TO_VESTA: Record<string, string> = {
  own: "Own",
  rent: "Rent",
  livingrentfree: "NoPrimaryHousingExpense",
  rentfree: "NoPrimaryHousingExpense",
  noprimaryhousingexpense: "NoPrimaryHousingExpense",
};

const UI_OCCUPANCY_TO_VESTA: Record<string, string> = {
  primaryresidence: "PrimaryResidence",
  secondhome: "SecondHome",
  investment: "Investment",
  investmentproperty: "Investment",
  other: "Other",
};

const UI_GIFT_SOURCE_TO_VESTA: Record<string, string> = {
  communitynonprofit: "CommunityNonProfit",
  employer: "Employer",
  federalagency: "FederalAgency",
  lender: "Lender",
  localagency: "LocalAgency",
  nonparentrelative: "NonParentRelative",
  other: "Other",
  parent: "Parent",
  relative: "Relative",
  religiousnonprofit: "ReligiousNonProfit",
  stateagency: "StateAgency",
  unmarriedpartner: "UnmarriedPartner",
  unrelatedfriend: "UnrelatedFriend",
  nonoriginatingfinancialinstitution: "NonOriginatingFinancialInstitution",
};

export function mapUiCitizenshipToVesta(ui: unknown): string | undefined {
  const key = compactEnumKey(ui);
  return key ? UI_CITIZENSHIP_TO_VESTA[key] : undefined;
}

export function mapUiMaritalStatusToVesta(ui: unknown): string | undefined {
  const key = compactEnumKey(ui);
  return key ? UI_MARITAL_STATUS_TO_VESTA[key] : undefined;
}

export function mapUiHousingStatusToVesta(ui: unknown): string | undefined {
  const key = compactEnumKey(ui);
  return key ? UI_HOUSING_STATUS_TO_VESTA[key] : undefined;
}

/** subjectProperty.intendedUsageType (PropertyUsageType). */
export function mapUiOccupancyToVesta(ui: unknown): string | undefined {
  const key = compactEnumKey(ui);
  return key ? UI_OCCUPANCY_TO_VESTA[key] : undefined;
}

/** Borrower.intentToOccupy. Investment is the only usage that is not occupancy. */
export function mapUiIntentToOccupy(ui: unknown): boolean | undefined {
  const usage = mapUiOccupancyToVesta(ui);
  if (usage === "PrimaryResidence" || usage === "SecondHome") return true;
  if (usage === "Investment") return false;
  return undefined;
}

export function mapUiGiftSourceToVesta(ui: unknown): string | undefined {
  const key = compactEnumKey(ui);
  return key ? UI_GIFT_SOURCE_TO_VESTA[key] : undefined;
}

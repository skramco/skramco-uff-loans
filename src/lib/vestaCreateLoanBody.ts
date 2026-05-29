/**
 * HTTP body for Vesta POST /loans (docs/vesta/openapi.json Loan schema).
 * Keep in sync with supabase/functions/_shared/vestaCreateLoan.ts
 */

import {
  buildLoanProductFromUiLoanType,
  mapUiLoanPurposeToVesta,
  mapUiPropertyTypeToVesta,
} from './vestaEnums';

export const VESTA_LOAN_TYPE = 'Mortgage';

function toNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function str(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const s = val.trim();
  return s || undefined;
}

function urlaSection(
  payload: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const urla = payload.urlaMapped as Record<string, unknown> | undefined;
  const section = urla?.[key];
  return section && typeof section === 'object'
    ? (section as Record<string, unknown>)
    : {};
}

function buildBorrower(
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const personal = urlaSection(payload, 'personalInfo');
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
    borrower.phoneNumbers = [{ type: 'Mobile', number: phoneNumber }];
  }
  return borrower;
}

function buildSubjectPropertyAddress(
  prop: Record<string, unknown>,
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const line =
    str(prop.address) ??
    str(payload.propertyAddress)?.split(',')[0]?.trim();
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
  const prop = urlaSection(payload, 'property');
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

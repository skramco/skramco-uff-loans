/**
 * HTTP body for Vesta POST /loans and PATCH /loans/{loanId}
 * (docs/vesta/openapi.json Loan schema).
 * Keep in sync with supabase/functions/_shared/vestaCreateLoan.ts
 */

import {
  buildLoanProductFromUiLoanType,
  mapUiCitizenshipToVesta,
  mapUiGiftSourceToVesta,
  mapUiHousingStatusToVesta,
  mapUiIntentToOccupy,
  mapUiLoanPurposeToVesta,
  mapUiMaritalStatusToVesta,
  mapUiOccupancyToVesta,
  mapUiPropertyTypeToVesta,
  mapUiRefinanceCashOutDetermination,
} from './vestaEnums';

export const VESTA_LOAN_TYPE = 'Mortgage';

/** Links incomes, assets, and liabilities to the primary borrower on create. */
export const VESTA_PRIMARY_BORROWER_REF = 'primary';

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

/** Portal dates are MMDDYYYY (also accepts MM/DD/YYYY and ISO). */
export function parsePortalDate(val: unknown): string | undefined {
  const raw = str(val);
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return undefined;
  const month = Number(digits.slice(0, 2));
  const day = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
}

function applyState(
  address: Record<string, unknown>,
  state: string | undefined
): void {
  if (!state) return;
  // Address.state is the state name. Two-letter codes belong on stateCode.
  if (/^[A-Za-z]{2}$/.test(state)) address.stateCode = state.toUpperCase();
  else address.state = state;
}

function monthlyIncome(
  amount: unknown
): { amount: number; amountType: 'Monthly' } | undefined {
  const n = toNumber(amount);
  if (n == null || n <= 0) return undefined;
  return { amount: n, amountType: 'Monthly' };
}

function positiveAmount(amount: unknown): number | undefined {
  const n = toNumber(amount);
  if (n == null || n <= 0) return undefined;
  return n;
}

function buildPostalAddress(parts: {
  line?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  occupancyType?: string;
  monthlyRentAmount?: number;
}): Record<string, unknown> | undefined {
  const address: Record<string, unknown> = {};
  if (parts.line) address.line = parts.line;
  if (parts.city) address.city = parts.city;
  applyState(address, parts.state);
  if (parts.zipCode) address.zipCode = parts.zipCode;
  if (parts.county) address.county = parts.county;
  if (parts.occupancyType) address.occupancyType = parts.occupancyType;
  if (parts.monthlyRentAmount != null) {
    address.monthlyRentAmount = parts.monthlyRentAmount;
  }
  return Object.keys(address).length > 0 ? address : undefined;
}

function buildCurrentAddress(
  personal: Record<string, unknown>
): Record<string, unknown> | undefined {
  return buildPostalAddress({
    line: str(personal.currentAddress),
    city: str(personal.currentCity),
    state: str(personal.currentState),
    zipCode: str(personal.currentZip),
    occupancyType: mapUiHousingStatusToVesta(personal.housingStatus),
    monthlyRentAmount: positiveAmount(personal.monthlyRent),
  });
}

function buildBorrower(
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const personal = urlaSection(payload, 'personalInfo');
  const property = urlaSection(payload, 'property');
  const firstName = str(payload.borrowerFirstName) ?? str(personal.firstName);
  const lastName = str(payload.borrowerLastName) ?? str(personal.lastName);
  const emailAddress = str(payload.borrowerEmail) ?? str(personal.email);
  const phoneNumber = str(payload.borrowerPhone) ?? str(personal.phone);
  const dateOfBirth = parsePortalDate(personal.dateOfBirth);
  const citizenshipType = mapUiCitizenshipToVesta(personal.citizenship);
  const maritalStatus = mapUiMaritalStatusToVesta(personal.maritalStatus);
  const currentAddress = buildCurrentAddress(personal);
  const intentToOccupy = mapUiIntentToOccupy(property.occupancyType);

  if (
    !firstName &&
    !lastName &&
    !emailAddress &&
    !phoneNumber &&
    !dateOfBirth &&
    !citizenshipType &&
    !maritalStatus &&
    !currentAddress &&
    intentToOccupy == null
  ) {
    return undefined;
  }

  const borrower: Record<string, unknown> = {
    ref: VESTA_PRIMARY_BORROWER_REF,
  };
  if (firstName) borrower.firstName = firstName;
  if (lastName) borrower.lastName = lastName;
  if (emailAddress) borrower.emailAddress = emailAddress;
  if (phoneNumber) {
    borrower.phoneNumbers = [{ type: 'Mobile', number: phoneNumber }];
  }
  if (dateOfBirth) borrower.dateOfBirth = dateOfBirth;
  if (citizenshipType) borrower.citizenshipType = citizenshipType;
  if (maritalStatus) borrower.maritalStatus = maritalStatus;
  if (currentAddress) borrower.currentAddress = currentAddress;
  if (intentToOccupy != null) borrower.intentToOccupy = intentToOccupy;
  return borrower;
}

function buildSubjectPropertyAddress(
  prop: Record<string, unknown>,
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  const line =
    str(prop.address) ??
    str(payload.propertyAddress)?.split(',')[0]?.trim();
  return buildPostalAddress({
    line,
    city: str(prop.city),
    state: str(prop.state),
    zipCode: str(prop.zip),
    county: str(prop.county),
  });
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
  const intendedUsageType = mapUiOccupancyToVesta(prop.occupancyType);

  if (
    !address &&
    estimatedValueAmount == null &&
    !propertyType &&
    !intendedUsageType
  ) {
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
  if (intendedUsageType) subjectProperty.intendedUsageType = intendedUsageType;
  if (address) subjectProperty.address = address;
  return subjectProperty;
}

function buildEmployer(
  source: Record<string, unknown>,
  status: 'Current' | 'Previous'
): Record<string, unknown> | undefined {
  const name = str(source.employerName ?? source.previousEmployerName);
  const jobTitle = str(source.position ?? source.previousPosition);
  const phoneNumber = str(source.employerPhone);
  const startDate = parsePortalDate(
    source.employmentStartDate ?? source.previousStartDate
  );
  const endDate = parsePortalDate(source.previousEndDate);
  const years = toNumber(source.yearsEmployed);
  const months =
    status === 'Current' && years != null && years >= 0
      ? Math.round(years * 12)
      : undefined;

  const address = buildPostalAddress({
    line: str(source.employerAddress),
    city: str(source.employerCity),
    state: str(source.employerState),
    zipCode: str(source.employerZip),
  });

  if (!name && !jobTitle && !phoneNumber && !startDate && !endDate && !address && months == null) {
    return undefined;
  }

  const employer: Record<string, unknown> = {
    status,
    employmentClassificationType: status === 'Current' ? 'Primary' : 'Secondary',
  };
  if (name) employer.name = name;
  if (jobTitle) employer.jobTitle = jobTitle;
  if (phoneNumber) employer.phoneNumber = phoneNumber;
  if (startDate) employer.startDate = startDate;
  if (endDate) employer.endDate = endDate;
  if (months != null) employer.numberOfMonthsInThisLineOfWork = months;
  if (address) employer.address = address;
  return employer;
}

function buildIncome(
  employment: Record<string, unknown>,
  borrowerRef: string | undefined,
  which: 'current' | 'previous'
): Record<string, unknown> | undefined {
  const previous = which === 'previous';
  const employer = previous
    ? buildEmployer(
        {
          previousEmployerName: employment.previousEmployerName,
          previousPosition: employment.previousPosition,
          previousStartDate: employment.previousStartDate,
          previousEndDate: employment.previousEndDate,
        },
        'Previous'
      )
    : buildEmployer(employment, 'Current');

  const base = monthlyIncome(
    previous ? employment.previousMonthlyIncome : employment.baseIncome
  );
  const overtime = previous ? undefined : monthlyIncome(employment.overtime);
  const bonus = previous ? undefined : monthlyIncome(employment.bonus);
  const commission = previous
    ? undefined
    : monthlyIncome(employment.commission);
  const other = previous ? undefined : monthlyIncome(employment.otherIncome);
  const total = previous
    ? undefined
    : monthlyIncome(employment.totalMonthlyIncome);
  const hasComponent = Boolean(base || overtime || bonus || commission || other);
  const statedBase = base ?? (!hasComponent ? total : undefined);

  if (!employer && !statedBase && !overtime && !bonus && !commission && !other) {
    return undefined;
  }

  const income: Record<string, unknown> = {
    incomeType:
      !previous && employment.selfEmployed === true
        ? 'SelfEmployment'
        : 'Employment',
  };
  if (income.incomeType === 'Employment') income.payType = 'Salaried';
  if (borrowerRef) income.borrowerRef = borrowerRef;
  if (employer) income.employer = employer;
  if (statedBase) income.statedEmploymentBaseIncome = statedBase;
  if (overtime) income.statedEmploymentOvertimeIncome = overtime;
  if (bonus) income.statedEmploymentBonusIncome = bonus;
  if (commission) income.statedEmploymentCommissionIncome = commission;
  if (other) income.statedEmploymentOtherIncome = other;
  return income;
}

function buildIncomes(
  payload: Record<string, unknown>,
  borrowerRef: string | undefined
): Record<string, unknown>[] {
  const employment = urlaSection(payload, 'employment');
  return [
    buildIncome(employment, borrowerRef, 'current'),
    buildIncome(employment, borrowerRef, 'previous'),
  ].filter((income): income is Record<string, unknown> => Boolean(income));
}

function buildAsset(
  assetType: string,
  amount: unknown,
  borrowerRef: string | undefined,
  extra?: Record<string, unknown>
): Record<string, unknown> | undefined {
  const assetValue = positiveAmount(amount);
  if (assetValue == null) return undefined;
  const asset: Record<string, unknown> = { assetType, assetValue, ...extra };
  if (borrowerRef) asset.borrowersRefs = [borrowerRef];
  return asset;
}

function buildAssets(
  payload: Record<string, unknown>,
  borrowerRef: string | undefined
): Record<string, unknown>[] {
  const assets = urlaSection(payload, 'assets');
  const giftExtra: Record<string, unknown> = {};
  const giftSource = mapUiGiftSourceToVesta(assets.giftSource);
  if (giftSource) giftExtra.giftOrGrantSource = giftSource;
  else if (str(assets.giftSource)) {
    giftExtra.otherGiftOrGrantSource = str(assets.giftSource);
  }

  return [
    buildAsset('CheckingAccount', assets.checkingAccounts, borrowerRef),
    buildAsset('SavingsAccount', assets.savingsAccounts, borrowerRef),
    buildAsset('RetirementFund', assets.retirementAccounts, borrowerRef),
    buildAsset('Other', assets.otherAssets, borrowerRef, {
      assetDescription: 'Other assets',
    }),
    buildAsset('GiftOfCash', assets.giftFunds, borrowerRef, giftExtra),
  ].filter((asset): asset is Record<string, unknown> => Boolean(asset));
}

function buildLiability(
  liabilityType: string,
  amount: unknown,
  borrowerRef: string | undefined
): Record<string, unknown> | undefined {
  const monthlyPaymentAmount = positiveAmount(amount);
  if (monthlyPaymentAmount == null) return undefined;
  const liability: Record<string, unknown> = {
    liabilityType,
    monthlyPaymentAmount,
  };
  if (borrowerRef) liability.borrowersRefs = [borrowerRef];
  return liability;
}

function buildLiabilities(
  payload: Record<string, unknown>,
  borrowerRef: string | undefined
): Record<string, unknown>[] {
  const liabilities = urlaSection(payload, 'liabilities');
  return [
    buildLiability(
      'RevolvingCreditLine',
      liabilities.creditCardDebt,
      borrowerRef
    ),
    buildLiability('SecuredInstallment', liabilities.carLoans, borrowerRef),
    // LiabilityType has no current student-loan value. A monthly payment is
    // not DeferredStudentLoan, so this is an unsecured installment.
    buildLiability(
      'UnsecuredInstallment',
      liabilities.studentLoans,
      borrowerRef
    ),
    buildLiability(
      'OtherLiability',
      liabilities.alimonyChildSupport,
      borrowerRef
    ),
    buildLiability('OtherLiability', liabilities.otherDebts, borrowerRef),
  ].filter((item): item is Record<string, unknown> => Boolean(item));
}

export function buildVestaCreateLoanHttpBody(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const loanDetails = urlaSection(payload, 'loanDetails');
  const body: Record<string, unknown> = {
    loanType: VESTA_LOAN_TYPE,
  };

  const loanPurpose = mapUiLoanPurposeToVesta(
    payload.loanPurpose ?? loanDetails.loanPurpose
  );
  if (loanPurpose) body.loanPurpose = loanPurpose;

  const cashOut = mapUiRefinanceCashOutDetermination(
    payload.loanPurpose ?? loanDetails.loanPurpose
  );
  if (cashOut) body.refinanceCashOutDeterminationType = cashOut;

  const loanAmount =
    toNumber(payload.loanAmount) ?? toNumber(loanDetails.loanAmount);
  if (loanAmount != null) body.loanAmount = loanAmount;

  const loanNumber = str(payload.loanNumber);
  if (loanNumber) body.loanNumber = loanNumber;

  const borrower = buildBorrower(payload);
  const borrowerRef = borrower ? VESTA_PRIMARY_BORROWER_REF : undefined;
  if (borrower) body.borrowers = [borrower];

  const subjectProperty = buildSubjectProperty(payload);
  if (subjectProperty) body.subjectProperty = subjectProperty;

  const loanProduct = buildLoanProductFromUiLoanType(
    payload.loanType ?? loanDetails.loanType
  );
  if (loanProduct) body.loanProduct = loanProduct;

  const incomes = buildIncomes(payload, borrowerRef);
  if (incomes.length > 0) body.incomes = incomes;

  const assets = buildAssets(payload, borrowerRef);
  if (assets.length > 0) body.assets = assets;

  const liabilities = buildLiabilities(payload, borrowerRef);
  if (liabilities.length > 0) body.liabilities = liabilities;

  return body;
}

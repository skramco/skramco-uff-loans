import type { LoanApplicationData } from '../types';

/** Version bumped when mapper output shape changes (stored on sync jobs). */
export const VESTA_MAPPING_VERSION = '1';

/**
 * Canonical mapping from URLA-style wizard data to a Vesta-friendly payload.
 * Top-level fields mirror existing createLoan contract; `urlaMapped` holds structured sections.
 */
export function mapLoanApplicationToVesta(data: LoanApplicationData): Record<string, unknown> {
  const p = data.personalInfo || {};
  const e = data.employment || {};
  const a = data.assets || {};
  const l = data.liabilities || {};
  const pr = data.property || {};
  const ld = data.loanDetails || {};
  const d = data.declarations || {};

  const propertyAddress = [pr.address, pr.city, pr.state, pr.zip].filter(Boolean).join(', ') || undefined;

  const urlaMapped = {
    personalInfo: {
      firstName: p.firstName,
      middleName: p.middleName,
      lastName: p.lastName,
      suffix: p.suffix,
      email: p.email,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth,
      ssn: p.ssn,
      citizenship: p.citizenship,
      maritalStatus: p.maritalStatus,
      dependentsCount: p.dependentsCount,
      dependentsAges: p.dependentsAges,
      currentAddress: p.currentAddress,
      currentCity: p.currentCity,
      currentState: p.currentState,
      currentZip: p.currentZip,
      yearsAtAddress: p.yearsAtAddress,
      housingStatus: p.housingStatus,
      monthlyRent: p.monthlyRent,
      previousAddress: p.previousAddress,
      previousCity: p.previousCity,
      previousState: p.previousState,
      previousZip: p.previousZip,
      yearsAtPrevAddress: p.yearsAtPrevAddress,
    },
    employment: {
      employerName: e.employerName,
      employerPhone: e.employerPhone,
      employerAddress: e.employerAddress,
      employerCity: e.employerCity,
      employerState: e.employerState,
      employerZip: e.employerZip,
      position: e.position,
      employmentStartDate: e.employmentStartDate,
      yearsEmployed: e.yearsEmployed,
      selfEmployed: e.selfEmployed,
      baseIncome: e.baseIncome,
      overtime: e.overtime,
      bonus: e.bonus,
      commission: e.commission,
      otherIncome: e.otherIncome,
      totalMonthlyIncome: e.totalMonthlyIncome,
      previousEmployerName: e.previousEmployerName,
      previousPosition: e.previousPosition,
      previousStartDate: e.previousStartDate,
      previousEndDate: e.previousEndDate,
      previousMonthlyIncome: e.previousMonthlyIncome,
    },
    assets: {
      totalAssets: a.totalAssets,
      checkingAccounts: a.checkingAccounts,
      savingsAccounts: a.savingsAccounts,
      retirementAccounts: a.retirementAccounts,
      otherAssets: a.otherAssets,
      giftFunds: a.giftFunds,
      giftSource: a.giftSource,
    },
    liabilities: {
      totalMonthlyDebt: l.totalMonthlyDebt,
      alimonyChildSupport: l.alimonyChildSupport,
      creditCardDebt: l.creditCardDebt,
      carLoans: l.carLoans,
      studentLoans: l.studentLoans,
      otherDebts: l.otherDebts,
    },
    property: {
      address: pr.address,
      city: pr.city,
      state: pr.state,
      zip: pr.zip,
      county: pr.county,
      propertyValue: pr.propertyValue,
      propertyType: pr.propertyType,
      occupancyType: pr.occupancyType,
      unitsCount: pr.unitsCount,
      mixedUse: pr.mixedUse,
      manufacturedHome: pr.manufacturedHome,
    },
    loanDetails: {
      loanPurpose: ld.loanPurpose,
      loanAmount: ld.loanAmount,
      downPayment: ld.downPayment,
      loanType: ld.loanType,
      interestRate: ld.interestRate,
      loanTerm: ld.loanTerm,
      currentMortgageBalance: ld.currentMortgageBalance,
      currentInterestRate: ld.currentInterestRate,
      cashOutAmount: ld.cashOutAmount,
      refinancePurpose: ld.refinancePurpose,
    },
    declarations: {
      outstandingJudgments: d.outstandingJudgments,
      bankruptcyLast7Years: d.bankruptcyLast7Years,
      foreclosureLast7Years: d.foreclosureLast7Years,
      lawsuitParty: d.lawsuitParty,
      delinquentFederalDebt: d.delinquentFederalDebt,
      alimonyObligation: d.alimonyObligation,
      downPaymentBorrowed: d.downPaymentBorrowed,
      usCitizen: d.usCitizen,
      permanentResident: d.permanentResident,
      currentlyServing: d.currentlyServing,
      previouslyServed: d.previouslyServed,
    },
  };

  return {
    borrowerFirstName: p.firstName,
    borrowerLastName: p.lastName,
    borrowerEmail: p.email,
    loanAmount: ld.loanAmount,
    propertyAddress: pr.address || propertyAddress,
    loanType: ld.loanType,
    loanPurpose: ld.loanPurpose,
    propertyValue: pr.propertyValue,
    applicationData: data,
    urlaMapped,
    mappingVersion: VESTA_MAPPING_VERSION,
  };
}

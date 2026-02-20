export interface VestaAddress {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface ExtractedBorrower {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  initials: string;
}

export interface ExtractedLoanOfficer {
  fullName: string;
  email: string;
  phone: string;
  nmls: string;
}

export interface ExtractedProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
  type: string;
  occupancy: string;
  value: number;
}

export interface ExtractedFinancials {
  loanAmount: number;
  loanPurpose: string;
  loanType: string;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  propertyTax: number;
  homeInsurance: number;
  pmi: number;
  totalMonthlyPayment: number;
  downPayment: number;
  ltv: number;
  closingCosts: number;
  cashToClose: number;
}

export interface ExtractedLoanStatus {
  currentMilestone: string;
  loanNumber: string;
  loanId: string;
  applicationDate: string;
  expectedCloseDate: string;
  lockExpirationDate: string;
  locked: boolean;
  lockRate: number;
}

function formatAddress(addr?: VestaAddress | null): string {
  if (!addr) return '';
  const parts = [addr.street1, addr.street2, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(', ');
}

function safeNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function safeString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val != null) return String(val);
  return fallback;
}

export function extractBorrower(loan: any): ExtractedBorrower {
  const b = loan?.borrowers?.[0] || loan?.borrower || {};
  const firstName = safeString(b.firstName || b.first_name, 'Borrower');
  const lastName = safeString(b.lastName || b.last_name, '');
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const emailEntry = b.emails?.[0]?.address || b.email || '';
  const phoneEntry = b.phoneNumbers?.find((p: any) => p.type?.toLowerCase() === 'mobile' || p.type?.toLowerCase() === 'cell')
    || b.phoneNumbers?.[0];
  const phone = phoneEntry?.number || b.phone || '';

  const initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();

  return { firstName, lastName, fullName, email: emailEntry, phone, initials };
}

export function extractLoanOfficer(loan: any): ExtractedLoanOfficer {
  const lo = loan?.loanOriginator || loan?.loanOfficer || {};
  return {
    fullName: safeString(lo.fullName || lo.name, 'Your Loan Officer'),
    email: safeString(lo.email, ''),
    phone: safeString(lo.phone || lo.phoneNumber, ''),
    nmls: safeString(lo.nmlsId || lo.nmls, ''),
  };
}

export function extractProperty(loan: any): ExtractedProperty {
  const sp = loan?.subjectProperty || loan?.property || {};
  const addr = sp?.address || {};

  return {
    address: safeString(addr.street1 || addr.streetAddress || sp.address),
    city: safeString(addr.city),
    state: safeString(addr.state),
    zip: safeString(addr.zipCode || addr.zip),
    fullAddress: formatAddress(addr) || safeString(sp.address),
    type: safeString(sp.propertyType || sp.type, 'Single Family'),
    occupancy: safeString(sp.occupancyType || sp.occupancy, 'Primary Residence'),
    value: safeNumber(sp.estimatedValue || sp.appraisedValue || sp.value || loan?.propertyValue),
  };
}

export function extractFinancials(loan: any): ExtractedFinancials {
  const loanAmount = safeNumber(loan?.loanAmount || loan?.baseLoanAmount || loan?.currentLoanAmount);
  const propertyValue = safeNumber(
    loan?.subjectProperty?.estimatedValue
    || loan?.subjectProperty?.appraisedValue
    || loan?.propertyValue
    || loan?.purchasePrice
  );
  const interestRate = safeNumber(loan?.interestRate || loan?.noteRate || loan?.currentInterestRate);
  const loanTerm = safeNumber(loan?.loanTerm || loan?.termMonths || 360);
  const termMonths = loanTerm > 100 ? loanTerm : loanTerm * 12;

  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0 && loanAmount > 0
    ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths)))
    : 0;

  const propertyTax = Math.round(propertyValue * 0.012 / 12);
  const homeInsurance = Math.round(propertyValue * 0.004 / 12);
  const ltv = propertyValue > 0 ? Math.round((loanAmount / propertyValue) * 100) : 0;
  const pmi = ltv > 80 ? Math.round(loanAmount * 0.005 / 12) : 0;
  const totalMonthlyPayment = monthlyPayment + propertyTax + homeInsurance + pmi;

  const downPayment = propertyValue - loanAmount;
  const closingCosts = Math.round(loanAmount * 0.025);
  const cashToClose = downPayment + closingCosts;

  return {
    loanAmount,
    loanPurpose: safeString(loan?.loanPurpose || loan?.purpose, 'Purchase'),
    loanType: safeString(loan?.loanType || loan?.mortgageType, 'Conventional'),
    interestRate,
    loanTerm: loanTerm > 100 ? Math.round(loanTerm / 12) : loanTerm,
    monthlyPayment,
    propertyTax,
    homeInsurance,
    pmi,
    totalMonthlyPayment,
    downPayment: Math.max(downPayment, 0),
    ltv,
    closingCosts,
    cashToClose: Math.max(cashToClose, 0),
  };
}

export function extractLoanStatus(loan: any): ExtractedLoanStatus {
  return {
    currentMilestone: safeString(
      loan?.currentMilestone || loan?.milestone || loan?.loanStatus || loan?.status,
      'Processing'
    ),
    loanNumber: safeString(loan?.loanNumber || loan?.loanNo, ''),
    loanId: safeString(loan?.id || loan?.loanId, ''),
    applicationDate: safeString(loan?.applicationDate || loan?.createdDate || loan?.created_at, ''),
    expectedCloseDate: safeString(loan?.expectedCloseDate || loan?.closingDate || loan?.anticipatedClosingDate, ''),
    lockExpirationDate: safeString(loan?.lockExpirationDate || loan?.rateLockExpiration, ''),
    locked: !!(loan?.lockExpirationDate || loan?.rateLockExpiration || loan?.isLocked),
    lockRate: safeNumber(loan?.interestRate || loan?.noteRate),
  };
}

const milestoneOrder = [
  'Application',
  'Disclosures',
  'Submitted',
  'Processing',
  'Underwriting',
  'Conditional Approval',
  'Clear to Close',
  'Closing',
  'Funded',
];

const milestoneAliases: Record<string, string> = {
  'application': 'Application',
  'started': 'Application',
  'initial disclosure': 'Disclosures',
  'disclosures sent': 'Disclosures',
  'disclosure': 'Disclosures',
  'submitted to processing': 'Submitted',
  'submitted': 'Submitted',
  'processing': 'Processing',
  'in processing': 'Processing',
  'underwriting': 'Underwriting',
  'in underwriting': 'Underwriting',
  'conditional approval': 'Conditional Approval',
  'conditionally approved': 'Conditional Approval',
  'approved with conditions': 'Conditional Approval',
  'clear to close': 'Clear to Close',
  'ctc': 'Clear to Close',
  'cleared to close': 'Clear to Close',
  'closing': 'Closing',
  'docs out': 'Closing',
  'closing docs': 'Closing',
  'funded': 'Funded',
  'closed': 'Funded',
};

export function buildTimeline(currentMilestone: string) {
  const normalized = milestoneAliases[currentMilestone.toLowerCase()] || currentMilestone;
  const currentIndex = milestoneOrder.indexOf(normalized);
  const activeIdx = currentIndex >= 0 ? currentIndex : 2;

  return milestoneOrder.map((label, i) => ({
    label,
    status: i < activeIdx ? 'completed' as const : i === activeIdx ? 'active' as const : 'upcoming' as const,
  }));
}

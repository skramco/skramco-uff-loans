export interface MortgageApplication {
  id?: string;
  application_number?: string;
  applicant_name: string;
  email: string;
  phone: string;
  loan_amount: number;
  property_value: number;
  property_address: string;
  employment_status: string;
  annual_income: number;
  credit_score_range: string;
  loan_type: string;
  first_time_buyer: boolean;
  down_payment: number;
  status?: string;
  ai_assistance_used?: boolean;
  additional_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface URLAApplication {
  id?: string;
  application_number?: string;

  borrower_first_name: string;
  borrower_middle_name?: string;
  borrower_last_name: string;
  borrower_suffix?: string;
  borrower_ssn?: string;
  borrower_dob?: string;
  borrower_citizenship?: string;
  borrower_marital_status?: string;
  borrower_dependents_count?: number;
  borrower_dependents_ages?: string;

  borrower_email: string;
  borrower_phone: string;
  borrower_current_address: string;
  borrower_current_city?: string;
  borrower_current_state?: string;
  borrower_current_zip?: string;
  borrower_years_at_address?: number;
  borrower_months_at_address?: number;
  borrower_housing_status?: string;
  borrower_monthly_rent?: number;

  borrower_previous_address?: string;
  borrower_previous_city?: string;
  borrower_previous_state?: string;
  borrower_previous_zip?: string;
  borrower_years_at_prev_address?: number;

  current_employer_name?: string;
  current_employer_phone?: string;
  current_employer_address?: string;
  current_employer_city?: string;
  current_employer_state?: string;
  current_employer_zip?: string;
  current_position?: string;
  current_employment_start_date?: string;
  current_years_employed?: number;
  current_months_employed?: number;
  self_employed?: boolean;
  current_base_income?: number;
  current_overtime?: number;
  current_bonus?: number;
  current_commission?: number;
  current_military_entitlements?: number;
  current_other_income?: number;
  current_total_monthly_income?: number;

  previous_employer_name?: string;
  previous_employer_phone?: string;
  previous_position?: string;
  previous_employment_start_date?: string;
  previous_employment_end_date?: string;
  previous_monthly_income?: number;

  checking_accounts?: any[];
  savings_accounts?: any[];
  retirement_accounts?: any[];
  other_assets?: any[];
  total_assets?: number;
  gift_funds?: number;
  gift_source?: string;

  monthly_liabilities?: any[];
  total_monthly_debt?: number;
  alimony_child_support?: number;

  real_estate_owned?: any[];

  loan_purpose: string;
  loan_amount: number;
  property_address: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  property_county?: string;
  property_value: number;
  property_type?: string;
  occupancy_type?: string;
  units_count?: number;
  mixed_use_property?: boolean;
  manufactured_home?: boolean;
  loan_type?: string;
  down_payment?: number;

  outstanding_judgments?: boolean;
  outstanding_judgments_explanation?: string;
  bankruptcy_last_7_years?: boolean;
  bankruptcy_explanation?: string;
  foreclosure_last_7_years?: boolean;
  foreclosure_explanation?: string;
  lawsuit_party?: boolean;
  lawsuit_explanation?: string;
  loan_foreclosure_obligation?: boolean;
  loan_foreclosure_obligation_explanation?: string;
  delinquent_federal_debt?: boolean;
  delinquent_federal_debt_explanation?: string;
  alimony_obligation?: boolean;
  down_payment_borrowed?: boolean;
  down_payment_borrowed_explanation?: string;
  co_maker_note?: boolean;
  us_citizen?: boolean;
  permanent_resident?: boolean;
  primary_residence?: boolean;
  ownership_last_3_years?: boolean;
  property_type_last_3_years?: string;
  ownership_title?: string;

  currently_serving?: boolean;
  previously_served?: boolean;
  active_duty?: boolean;
  surviving_spouse?: boolean;
  non_activated_reserves?: boolean;

  ethnicity_hispanic_latino?: boolean;
  ethnicity_not_hispanic_latino?: boolean;
  ethnicity_not_provided?: boolean;
  race_american_indian?: string;
  race_asian?: string;
  race_black?: boolean;
  race_pacific_islander?: string;
  race_white?: boolean;
  race_not_provided?: boolean;
  sex?: string;
  demographic_info_provided_via?: string;

  status?: string;
  ai_assistance_used?: boolean;
  additional_notes?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  current_section?: number;
  completed_sections?: number[];
}

export interface CalculatorInputs {
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  propertyValue?: number;
  downPayment?: number;
  propertyTax?: number;
  insurance?: number;
  hoa?: number;
}

export interface CalculatorResults {
  monthlyPayment?: number;
  totalInterest?: number;
  totalPayment?: number;
  loanToValue?: number;
  monthlyTaxes?: number;
  monthlyInsurance?: number;
  totalMonthly?: number;
}

export interface BorrowerProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  borrower_id: string;
  vesta_loan_id?: string | null;
  status: string;
  loan_amount?: number | null;
  loan_type?: string | null;
  property_address?: string | null;
  loan_application_data?: LoanApplicationData | null;
  application_progress?: number;
  is_submitted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoanApplicationData {
  personalInfo?: PersonalInfoSection;
  employment?: EmploymentSection;
  assets?: AssetsSection;
  liabilities?: LiabilitiesSection;
  property?: PropertySection;
  loanDetails?: LoanDetailsSection;
  declarations?: DeclarationsSection;
}

export interface PersonalInfoSection {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  ssn?: string;
  citizenship?: string;
  maritalStatus?: string;
  dependentsCount?: number;
  dependentsAges?: string;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentZip?: string;
  yearsAtAddress?: number;
  housingStatus?: string;
  monthlyRent?: number;
  previousAddress?: string;
  previousCity?: string;
  previousState?: string;
  previousZip?: string;
  yearsAtPrevAddress?: number;
}

export interface EmploymentSection {
  employerName?: string;
  employerPhone?: string;
  employerAddress?: string;
  employerCity?: string;
  employerState?: string;
  employerZip?: string;
  position?: string;
  employmentStartDate?: string;
  yearsEmployed?: number;
  selfEmployed?: boolean;
  baseIncome?: number;
  overtime?: number;
  bonus?: number;
  commission?: number;
  otherIncome?: number;
  totalMonthlyIncome?: number;
  previousEmployerName?: string;
  previousPosition?: string;
  previousStartDate?: string;
  previousEndDate?: string;
  previousMonthlyIncome?: number;
}

export interface AssetsSection {
  totalAssets?: number;
  checkingAccounts?: number;
  savingsAccounts?: number;
  retirementAccounts?: number;
  otherAssets?: number;
  giftFunds?: number;
  giftSource?: string;
}

export interface LiabilitiesSection {
  totalMonthlyDebt?: number;
  alimonyChildSupport?: number;
  creditCardDebt?: number;
  carLoans?: number;
  studentLoans?: number;
  otherDebts?: number;
}

export interface PropertySection {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  propertyValue?: number;
  propertyType?: string;
  occupancyType?: string;
  unitsCount?: number;
  mixedUse?: boolean;
  manufacturedHome?: boolean;
}

export interface LoanDetailsSection {
  loanPurpose?: string;
  loanAmount?: number;
  downPayment?: number;
  loanType?: string;
  interestRate?: number;
  loanTerm?: number;
  // Refinance-specific
  currentMortgageBalance?: number;
  currentInterestRate?: number;
  cashOutAmount?: number;
  refinancePurpose?: string;
}

export interface DeclarationsSection {
  outstandingJudgments?: boolean;
  bankruptcyLast7Years?: boolean;
  foreclosureLast7Years?: boolean;
  lawsuitParty?: boolean;
  delinquentFederalDebt?: boolean;
  alimonyObligation?: boolean;
  downPaymentBorrowed?: boolean;
  usCitizen?: boolean;
  permanentResident?: boolean;
  currentlyServing?: boolean;
  previouslyServed?: boolean;
}

export interface VestaLoanPayload {
  loanNumber?: string;
  borrowerFirstName?: string;
  borrowerLastName?: string;
  borrowerEmail?: string;
  loanAmount?: number;
  propertyAddress?: string;
  loanType?: string;
  loanPurpose?: string;
  propertyValue?: number;
  applicationData?: LoanApplicationData;
}

export interface Condition {
  id: string;
  loan_id: string;
  title: string;
  description?: string | null;
  status: 'Open' | 'Submitted' | 'Cleared';
  responsible_party: 'Borrower' | 'Lender';
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  loan_id: string;
  condition_id?: string | null;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by: string;
  created_at?: string;
}

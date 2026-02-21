import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { LoanApplicationData } from '../types';

const AUTOSAVE_DELAY = 1500;

const EMPTY_APPLICATION: LoanApplicationData = {
  personalInfo: {},
  employment: {},
  assets: {},
  liabilities: {},
  property: {},
  loanDetails: {},
  declarations: {},
};

export type SectionKey = keyof LoanApplicationData;

export const SECTION_ORDER: SectionKey[] = [
  'personalInfo',
  'employment',
  'assets',
  'liabilities',
  'property',
  'loanDetails',
  'declarations',
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  personalInfo: 'Personal Information',
  employment: 'Employment & Income',
  assets: 'Assets',
  liabilities: 'Liabilities',
  property: 'Property',
  loanDetails: 'Loan Details',
  declarations: 'Review & Declarations',
};

export interface ValidationErrors {
  [field: string]: string;
}

export function validateSection(section: SectionKey, data: LoanApplicationData): ValidationErrors {
  const errors: ValidationErrors = {};
  const s = data[section] || {};

  switch (section) {
    case 'personalInfo': {
      const p = s as NonNullable<LoanApplicationData['personalInfo']>;
      if (!p.firstName?.trim()) errors.firstName = 'First name is required';
      if (!p.lastName?.trim()) errors.lastName = 'Last name is required';
      if (!p.email?.trim()) errors.email = 'Email is required';
      if (!p.phone?.trim()) errors.phone = 'Phone is required';
      if (!p.currentAddress?.trim()) errors.currentAddress = 'Address is required';
      if (!p.currentCity?.trim()) errors.currentCity = 'City is required';
      if (!p.currentState?.trim()) errors.currentState = 'State is required';
      if (!p.currentZip?.trim()) errors.currentZip = 'ZIP is required';
      break;
    }
    case 'employment': {
      const e = s as NonNullable<LoanApplicationData['employment']>;
      if (!e.employerName?.trim()) errors.employerName = 'Employer name is required';
      if (!e.position?.trim()) errors.position = 'Position is required';
      if (!e.baseIncome || e.baseIncome <= 0) errors.baseIncome = 'Base income is required';
      break;
    }
    case 'assets': {
      const a = s as NonNullable<LoanApplicationData['assets']>;
      if (a.totalAssets === undefined || a.totalAssets === null) errors.totalAssets = 'Total assets is required';
      break;
    }
    case 'liabilities': {
      const l = s as NonNullable<LoanApplicationData['liabilities']>;
      if (l.totalMonthlyDebt === undefined || l.totalMonthlyDebt === null) errors.totalMonthlyDebt = 'Monthly debt is required';
      break;
    }
    case 'property': {
      const pr = s as NonNullable<LoanApplicationData['property']>;
      if (!pr.address?.trim()) errors.address = 'Property address is required';
      if (!pr.city?.trim()) errors.city = 'City is required';
      if (!pr.state?.trim()) errors.state = 'State is required';
      if (!pr.zip?.trim()) errors.zip = 'ZIP is required';
      if (!pr.propertyValue || pr.propertyValue <= 0) errors.propertyValue = 'Property value is required';
      break;
    }
    case 'loanDetails': {
      const ld = s as NonNullable<LoanApplicationData['loanDetails']>;
      if (!ld.loanPurpose?.trim()) errors.loanPurpose = 'Loan purpose is required';
      if (!ld.loanAmount || ld.loanAmount <= 0) errors.loanAmount = 'Loan amount is required';
      const isRefi = ld.loanPurpose === 'Refinance' || ld.loanPurpose === 'Cash-Out Refinance';
      if (isRefi && (!ld.currentMortgageBalance || ld.currentMortgageBalance <= 0)) {
        errors.currentMortgageBalance = 'Current mortgage balance is required';
      }
      break;
    }
    case 'declarations':
      break;
  }

  return errors;
}

export function validateAll(data: LoanApplicationData): Record<SectionKey, ValidationErrors> {
  const result = {} as Record<SectionKey, ValidationErrors>;
  for (const key of SECTION_ORDER) {
    result[key] = validateSection(key, data);
  }
  return result;
}

export function isSectionValid(section: SectionKey, data: LoanApplicationData): boolean {
  return Object.keys(validateSection(section, data)).length === 0;
}

export function useApplicationForm(existingLoanId?: string) {
  const { user } = useAuth();
  const [loanId, setLoanId] = useState<string | null>(existingLoanId || null);
  const [tempLoanNumber, setTempLoanNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoanApplicationData>(EMPTY_APPLICATION);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!existingLoanId);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    if (existingLoanId && user) {
      loadExistingLoan(existingLoanId);
    } else if (user) {
      loadDraftLoan();
    }
  }, [existingLoanId, user]);

  async function loadExistingLoan(id: string) {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setLoanId(data.id);
        setTempLoanNumber(data.temp_loan_number || null);
        setFormData(data.loan_application_data || EMPTY_APPLICATION);
        setCurrentStep(data.application_progress || 0);
        setIsSubmitted(data.is_submitted || false);
      }
    } catch (err) {
      console.error('Error loading loan:', err);
    } finally {
      setLoading(false);
    }
  }

  function prefillFromLead(base: LoanApplicationData): LoanApplicationData {
    try {
      // Prefill name and email from auth user metadata
      const meta = user?.user_metadata;
      let prefilled: LoanApplicationData = {
        ...base,
        personalInfo: {
          ...(base.personalInfo || {}),
          firstName: meta?.first_name || base.personalInfo?.firstName || '',
          lastName: meta?.last_name || base.personalInfo?.lastName || '',
          email: user?.email || base.personalInfo?.email || '',
        },
      };

      const raw = localStorage.getItem('uff_lead');
      if (!raw) return prefilled;
      const lead = JSON.parse(raw);

      const purposeMap: Record<string, string> = {
        buy: 'Purchase',
        refi: 'Refinance',
        equity: 'Cash-Out Refinance',
      };

      const propertyTypeMap: Record<string, string> = {
        single: 'Single Family',
        condo: 'Condo',
        townhouse: 'Townhouse',
        multi: 'Multi-Family (2-4)',
      };

      const isRefiLead = lead.intent === 'refi' || lead.intent === 'equity';

      prefilled = {
        ...prefilled,
        property: {
          ...(prefilled.property || {}),
          zip: lead.zip || prefilled.property?.zip || '',
          propertyType: lead.propertyType ? propertyTypeMap[lead.propertyType] || '' : prefilled.property?.propertyType || '',
          propertyValue: lead.intent === 'buy'
            ? parseFloat(lead.homePrice) || prefilled.property?.propertyValue
            : parseFloat(lead.homeValue) || prefilled.property?.propertyValue,
        },
        loanDetails: {
          ...(prefilled.loanDetails || {}),
          loanPurpose: lead.intent ? purposeMap[lead.intent] || '' : prefilled.loanDetails?.loanPurpose || '',
          loanAmount: lead.results?.loan || prefilled.loanDetails?.loanAmount,
          ...(isRefiLead && lead.currentBalance ? { currentMortgageBalance: parseFloat(lead.currentBalance) || undefined } : {}),
        },
      };

      localStorage.removeItem('uff_lead');
      return prefilled;
    } catch {
      return base;
    }
  }

  async function loadDraftLoan() {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_id', user.id)
        .eq('is_submitted', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setLoanId(data.id);
        setTempLoanNumber(data.temp_loan_number || null);
        setFormData(data.loan_application_data || EMPTY_APPLICATION);
        setCurrentStep(data.application_progress || 0);
      } else {
        // No draft exists — create one immediately so loanId is always set
        const prefilledData = prefillFromLead(EMPTY_APPLICATION);
        setFormData(prefilledData);

        const { data: newLoan, error: insertErr } = await supabase
          .from('loans')
          .insert({
            borrower_id: user.id,
            status: 'In Progress',
            loan_application_data: prefilledData,
            application_progress: 0,
          })
          .select()
          .maybeSingle();

        if (insertErr) {
          console.error('Error creating draft loan:', insertErr);
        } else if (newLoan) {
          setLoanId(newLoan.id);
          setTempLoanNumber(newLoan.temp_loan_number || null);
        }
      }
    } catch (err) {
      console.error('Error loading draft:', err);
    } finally {
      setLoading(false);
    }
  }

  const saveLoan = useCallback(async (data: LoanApplicationData, step: number) => {
    if (!user || isSubmitted) return;

    setSaving(true);
    try {
      const loanAmount = data.loanDetails?.loanAmount || null;
      const loanType = data.loanDetails?.loanType || null;
      const propertyAddress = data.property?.address
        ? [data.property.address, data.property.city, data.property.state, data.property.zip].filter(Boolean).join(', ')
        : null;

      if (loanId) {
        const { error } = await supabase
          .from('loans')
          .update({
            loan_application_data: data,
            application_progress: step,
            loan_amount: loanAmount,
            loan_type: loanType,
            property_address: propertyAddress,
          })
          .eq('id', loanId);

        if (error) throw error;
      } else {
        const { data: newLoan, error } = await supabase
          .from('loans')
          .insert({
            borrower_id: user.id,
            status: 'In Progress',
            loan_application_data: data,
            application_progress: step,
            loan_amount: loanAmount,
            loan_type: loanType,
            property_address: propertyAddress,
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        if (newLoan) {
          setLoanId(newLoan.id);
          setTempLoanNumber(newLoan.temp_loan_number || null);
        }
      }

      // Sync phone to borrower_profiles if available
      const phone = data.personalInfo?.phone;
      if (phone && user) {
        supabase
          .from('borrower_profiles')
          .update({ phone })
          .eq('id', user.id)
          .then(({ error: phoneErr }) => {
            if (phoneErr) console.error('Error syncing phone:', phoneErr);
          });
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving loan:', err);
    } finally {
      setSaving(false);
      pendingSaveRef.current = false;
    }
  }, [user, loanId, isSubmitted]);

  const debouncedSave = useCallback((data: LoanApplicationData, step: number) => {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveLoan(data, step);
    }, AUTOSAVE_DELAY);
  }, [saveLoan]);

  function updateSection<K extends SectionKey>(
    section: K,
    field: string,
    value: any
  ) {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [field]: value,
        },
      };

      if (section === 'employment') {
        const emp = updated.employment || {};
        const base = emp.baseIncome || 0;
        const ot = emp.overtime || 0;
        const bonus = emp.bonus || 0;
        const comm = emp.commission || 0;
        const other = emp.otherIncome || 0;
        updated.employment = {
          ...emp,
          totalMonthlyIncome: base + ot + bonus + comm + other,
        };
      }

      debouncedSave(updated, currentStep);
      return updated;
    });
  }

  function updateSectionBulk<K extends SectionKey>(
    section: K,
    values: Partial<NonNullable<LoanApplicationData[K]>>
  ) {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          ...values,
        },
      };
      debouncedSave(updated, currentStep);
      return updated;
    });
  }

  async function saveAndAdvance() {
    const nextStep = Math.min(currentStep + 1, SECTION_ORDER.length - 1);
    setCurrentStep(nextStep);
    await saveLoan(formData, nextStep);
  }

  async function goBack() {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
  }

  function goToStep(step: number) {
    setCurrentStep(Math.max(0, Math.min(step, SECTION_ORDER.length - 1)));
  }

  async function submitApplication() {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      let submitLoanId = loanId;

      // If no loanId exists, create the loan now
      if (!submitLoanId) {
        const loanAmount = formData.loanDetails?.loanAmount || null;
        const loanType = formData.loanDetails?.loanType || null;
        const propertyAddress = formData.property?.address
          ? [formData.property.address, formData.property.city, formData.property.state, formData.property.zip].filter(Boolean).join(', ')
          : null;

        const { data: newLoan, error: insertErr } = await supabase
          .from('loans')
          .insert({
            borrower_id: user.id,
            status: 'Submitted',
            loan_application_data: formData,
            application_progress: SECTION_ORDER.length,
            is_submitted: true,
            loan_amount: loanAmount,
            loan_type: loanType,
            property_address: propertyAddress,
          })
          .select()
          .maybeSingle();

        if (insertErr) throw insertErr;
        if (newLoan) {
          submitLoanId = newLoan.id;
          setLoanId(newLoan.id);
          setTempLoanNumber(newLoan.temp_loan_number || null);
        }
      } else {
        const { error } = await supabase
          .from('loans')
          .update({
            loan_application_data: formData,
            application_progress: SECTION_ORDER.length,
            is_submitted: true,
            status: 'Submitted',
          })
          .eq('id', submitLoanId);

        if (error) throw error;
      }

      setIsSubmitted(true);
      return { success: true, error: null, loanId: submitLoanId };
    } catch (err: any) {
      return { success: false, error: err.message, loanId: null };
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    loanId,
    tempLoanNumber,
    formData,
    currentStep,
    saving,
    loading,
    isSubmitted,
    lastSaved,
    setCurrentStep: goToStep,
    updateSection,
    updateSectionBulk,
    saveAndAdvance,
    goBack,
    submitApplication,
    saveLoan,
  };
}

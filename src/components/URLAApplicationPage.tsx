import { Loader, CheckCircle, AlertCircle, Home, Briefcase, DollarSign, FileText, Shield, Flag, User, Sparkles, Send } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { URLAApplication } from '../types';

interface URLAApplicationPageProps {
  onNavigate: (page: string) => void;
}

export default function URLAApplicationPage({ onNavigate }: URLAApplicationPageProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [showLoanTypeHelper, setShowLoanTypeHelper] = useState(false);
  const [loanTypeAnswers, setLoanTypeAnswers] = useState<{
    militaryService?: boolean;
    firstTimeBuyer?: boolean;
    creditScore?: string;
    downPaymentPercent?: string;
    ruralProperty?: boolean;
  }>({});

  const [formData, setFormData] = useState<Partial<URLAApplication>>({
    borrower_first_name: '',
    borrower_last_name: '',
    borrower_email: '',
    borrower_phone: '',
    borrower_current_address: '',
    borrower_current_city: '',
    borrower_current_state: '',
    borrower_current_zip: '',
    borrower_years_at_address: 0,
    borrower_housing_status: 'rent',
    borrower_marital_status: '',
    borrower_citizenship: '',
    current_employer_name: '',
    current_position: '',
    current_years_employed: 0,
    self_employed: false,
    current_base_income: 0,
    current_total_monthly_income: 0,
    total_assets: 0,
    total_monthly_debt: 0,
    loan_purpose: 'purchase',
    loan_amount: 0,
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    property_value: 0,
    property_type: 'single_family',
    occupancy_type: 'primary_residence',
    loan_type: 'conventional',
    down_payment: 0,
    outstanding_judgments: false,
    bankruptcy_last_7_years: false,
    foreclosure_last_7_years: false,
    us_citizen: true,
    currently_serving: false,
    status: 'draft',
  });

  const sections = [
    { id: 1, name: 'Borrower Information', icon: User },
    { id: 2, name: 'Employment & Income', icon: Briefcase },
    { id: 3, name: 'Assets & Liabilities', icon: DollarSign },
    { id: 4, name: 'Property & Loan Details', icon: Home },
    { id: 5, name: 'Declarations', icon: FileText },
    { id: 6, name: 'Military Service', icon: Flag },
    { id: 7, name: 'Review & Submit', icon: Shield },
  ];

  const totalSteps = sections.length;

  const handleInputChange = (field: keyof URLAApplication, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'current_base_income' || field === 'current_overtime' || field === 'current_bonus' || field === 'current_commission') {
        const base = field === 'current_base_income' ? value : (updated.current_base_income || 0);
        const overtime = field === 'current_overtime' ? value : (updated.current_overtime || 0);
        const bonus = field === 'current_bonus' ? value : (updated.current_bonus || 0);
        const commission = field === 'current_commission' ? value : (updated.current_commission || 0);
        updated.current_total_monthly_income = base + overtime + bonus + commission;
      }

      return updated;
    });
  };

  const getLoanTypeRecommendation = () => {
    const { militaryService, firstTimeBuyer, creditScore, downPaymentPercent, ruralProperty } = loanTypeAnswers;

    // Check if property value qualifies as jumbo
    const isJumbo = formData.property_value && formData.property_value > 766550;

    if (militaryService) {
      return {
        type: 'va',
        title: 'VA Loan',
        reason: 'As a veteran or active military member, you qualify for VA loans - one of the best programs available! VA loans offer 0% down payment, no PMI, competitive rates, and flexible credit requirements. This is your best option!',
        confidence: 'Highly Recommended',
        bgGradient: 'from-[#c54d4d] to-[#a03939]',
        bgLight: 'from-red-50 to-rose-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800'
      };
    }

    if (isJumbo) {
      return {
        type: 'jumbo',
        title: 'Jumbo Loan',
        reason: `Your property value of $${formData.property_value?.toLocaleString()} exceeds the conforming loan limit of $766,550. You'll need a Jumbo loan, which requires higher credit scores (700+), larger down payments (10-20%), and more cash reserves.`,
        confidence: 'Required',
        bgGradient: 'from-[#8c6bb1] to-[#6f5694]',
        bgLight: 'from-purple-50 to-violet-50',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800'
      };
    }

    if (ruralProperty) {
      return {
        type: 'usda',
        title: 'USDA Loan',
        reason: 'Since your property is in a rural or suburban area, you may qualify for a USDA loan with 0% down payment! USDA loans offer competitive rates and low fees. However, there are income limits that apply.',
        confidence: 'Strongly Recommended',
        bgGradient: 'from-[#d97f3d] to-[#b86621]',
        bgLight: 'from-orange-50 to-amber-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800'
      };
    }

    const lowCredit = creditScore === 'below_620' || creditScore === '620_679';
    const lowDown = downPaymentPercent === 'less_than_5' || downPaymentPercent === '5_10';

    if (lowCredit || (lowDown && firstTimeBuyer)) {
      return {
        type: 'fha',
        title: 'FHA Loan',
        reason: `FHA loans are perfect for your situation! ${lowCredit ? 'They accept credit scores as low as 580.' : ''} ${lowDown ? 'You can put down as little as 3.5%.' : ''} ${firstTimeBuyer ? 'They\'re designed specifically for first-time buyers.' : ''} FHA loans have flexible qualification standards and are easier to qualify for than conventional loans.`,
        confidence: 'Highly Recommended',
        bgGradient: 'from-[#3d9c7a] to-[#2d7058]',
        bgLight: 'from-green-50 to-emerald-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800'
      };
    }

    const goodCredit = creditScore === '740_plus';
    const goodDown = downPaymentPercent === '20_plus';

    if (goodCredit && goodDown) {
      return {
        type: 'conventional',
        title: 'Conventional Loan',
        reason: 'With your strong credit score and 20%+ down payment, a Conventional loan offers you the best rates and terms! You\'ll avoid PMI entirely and qualify for the most competitive interest rates available.',
        confidence: 'Highly Recommended',
        bgGradient: 'from-red-700 to-[#2d5a70]',
        bgLight: 'from-red-50 to-cyan-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800'
      };
    }

    return {
      type: 'conventional',
      title: 'Conventional Loan',
      reason: 'A Conventional loan is a solid choice for most borrowers. It offers competitive rates, flexible terms, and becomes very attractive once you reach 20% equity (no PMI required).',
      confidence: 'Recommended',
      bgGradient: 'from-red-700 to-[#2d5a70]',
      bgLight: 'from-red-50 to-cyan-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800'
    };
  };

  const applyLoanTypeRecommendation = () => {
    const recommendation = getLoanTypeRecommendation();
    handleInputChange('loan_type', recommendation.type);
    setShowLoanTypeHelper(false);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const application: Partial<URLAApplication> = {
        ...formData,
        status: 'submitted',
        ai_assistance_used: false,
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('urla_applications')
        .insert([application])
        .select()
        .maybeSingle();

      if (error) throw error;

      const appNumber = data?.application_number || 'URLA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const viewToken = data?.view_token;
      setApplicationNumber(appNumber);

      try {
        const emailResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-application-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              applicationType: 'urla',
              applicantName: `${formData.borrower_first_name} ${formData.borrower_last_name}`,
              applicantEmail: formData.borrower_email,
              applicationNumber: appNumber,
              viewToken: viewToken,
              applicationData: {
                loanAmount: formData.loan_amount,
                propertyValue: formData.property_value,
                propertyAddress: formData.property_area,
                monthlyIncome: formData.current_total_monthly_income,
                loanType: formData.loan_type,
                employerName: formData.current_employer_name,
              },
            }),
          }
        );

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error('Failed to send confirmation emails:', emailResult);
          console.warn('Note: Email delivery requires Resend domain verification. Check EMAIL_SETUP.md for details.');
        } else {
          console.log('Email sent successfully:', emailResult);
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        console.warn('Note: Email delivery requires Resend domain verification. Check EMAIL_SETUP.md for details.');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.borrower_first_name && formData.borrower_last_name &&
               formData.borrower_email && formData.borrower_phone &&
               formData.borrower_current_address && formData.borrower_current_city &&
               formData.borrower_current_state && formData.borrower_current_zip &&
               formData.borrower_marital_status && formData.borrower_citizenship;
      case 2:
        return formData.current_employer_name && formData.current_position &&
               formData.current_base_income && formData.current_years_employed;
      case 3:
        return formData.total_assets !== undefined && formData.total_monthly_debt !== undefined;
      case 4:
        return formData.loan_amount && formData.property_value && formData.property_address &&
               formData.property_city && formData.property_state && formData.property_zip;
      case 5:
      case 6:
      case 7:
        return true;
      default:
        return false;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 text-center mt-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-700" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>

            <div className="bg-gradient-to-br from-red-50 to-sky-100 rounded-lg p-6 mb-8">
              <div className="text-sm text-gray-600 mb-2">Your Application Number</div>
              <div className="text-3xl font-bold text-red-700">{applicationNumber}</div>
            </div>

            <p className="text-lg text-gray-700 mb-4">
              Thank you for completing your mortgage loan application! A loan officer will
              review your submission and contact you within 24 hours to discuss next steps and required documentation.
            </p>

            <p className="text-sm text-gray-600 mb-8">
              A confirmation email has been sent to <strong>{formData.borrower_email}</strong>
            </p>

            <div className="bg-gradient-to-br from-red-50 to-cyan-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-red-700 mr-2" />
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-red-700 mr-2">1.</span>
                  <span>Application review and initial credit check (1-2 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-red-700 mr-2">2.</span>
                  <span>Loan officer will contact you to discuss documentation requirements</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-red-700 mr-2">3.</span>
                  <span>Submit required documents (pay stubs, tax returns, bank statements)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-red-700 mr-2">4.</span>
                  <span>Receive pre-approval letter (typically 3-5 business days)</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('home')}
                className="px-8 py-3 bg-gradient-to-r from-red-700 to-red-800 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Return Home
              </button>
              <button
                onClick={() => onNavigate('calculators')}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
              >
                Try Our Calculators
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 1a: Borrower Information</h2>
              <p className="text-sm text-gray-600">Provide your legal name exactly as it appears on your government-issued ID</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.borrower_first_name || ''}
                  onChange={(e) => handleInputChange('borrower_first_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="John"
                />
                <p className="mt-1 text-xs text-gray-500">As it appears on your ID</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.borrower_last_name || ''}
                  onChange={(e) => handleInputChange('borrower_last_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="Doe"
                />
                <p className="mt-1 text-xs text-gray-500">As it appears on your ID</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.borrower_email || ''}
                  onChange={(e) => handleInputChange('borrower_email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.borrower_phone || ''}
                  onChange={(e) => handleInputChange('borrower_phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Address *
              </label>
              <input
                type="text"
                value={formData.borrower_current_address || ''}
                onChange={(e) => handleInputChange('borrower_current_address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                placeholder="123 Main St, Apt 4B"
              />
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.borrower_current_city || ''}
                  onChange={(e) => handleInputChange('borrower_current_city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.borrower_current_state || ''}
                  onChange={(e) => handleInputChange('borrower_current_state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="NY"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.borrower_current_zip || ''}
                  onChange={(e) => handleInputChange('borrower_current_zip', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="10001"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years at Address *
                </label>
                <input
                  type="number"
                  value={formData.borrower_years_at_address || ''}
                  onChange={(e) => handleInputChange('borrower_years_at_address', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  min="0"
                  placeholder="2"
                />
                <p className="mt-1 text-xs text-gray-500">If less than 2 years, we'll ask for previous address</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Housing Status *
                </label>
                <select
                  value={formData.borrower_housing_status || 'rent'}
                  onChange={(e) => handleInputChange('borrower_housing_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="rent">Rent</option>
                  <option value="own">Own</option>
                  <option value="living_rent_free">Living Rent Free</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monthly Rent/Mortgage
                </label>
                <input
                  type="number"
                  value={formData.borrower_monthly_rent || ''}
                  onChange={(e) => handleInputChange('borrower_monthly_rent', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="1500"
                />
                <p className="mt-1 text-xs text-gray-500">Your current housing payment</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marital Status *
                </label>
                <select
                  value={formData.borrower_marital_status || ''}
                  onChange={(e) => handleInputChange('borrower_marital_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="married">Married</option>
                  <option value="separated">Separated</option>
                  <option value="unmarried">Unmarried (Single, Divorced, Widowed)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Affects community property states and joint applications</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Citizenship Status *
                </label>
                <select
                  value={formData.borrower_citizenship || ''}
                  onChange={(e) => handleInputChange('borrower_citizenship', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="us_citizen">U.S. Citizen</option>
                  <option value="permanent_resident">Permanent Resident Alien</option>
                  <option value="non_permanent_resident">Non-Permanent Resident Alien</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Non-citizens can qualify with proper documentation</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 1b: Employment and Income</h2>
              <p className="text-sm text-gray-600">Provide information about your current employment and monthly income</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Employer Name *
                </label>
                <input
                  type="text"
                  value={formData.current_employer_name || ''}
                  onChange={(e) => handleInputChange('current_employer_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position/Title *
                </label>
                <input
                  type="text"
                  value={formData.current_position || ''}
                  onChange={(e) => handleInputChange('current_position', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years with Employer *
                </label>
                <input
                  type="number"
                  value={formData.current_years_employed || ''}
                  onChange={(e) => handleInputChange('current_years_employed', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  min="0"
                  step="0.1"
                  placeholder="3.5"
                />
                <p className="mt-1 text-xs text-gray-500">Include decimals (e.g., 2.5 for 2 years, 6 months)</p>
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="selfEmployed"
                  checked={formData.self_employed || false}
                  onChange={(e) => handleInputChange('self_employed', e.target.checked)}
                  className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700"
                />
                <label htmlFor="selfEmployed" className="ml-3 text-sm font-semibold text-gray-700">
                  Self-Employed
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Income</h3>
              <p className="text-sm text-gray-600 mb-4">Enter your gross (before taxes) monthly income from all sources</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Monthly Income *
                  </label>
                  <input
                    type="number"
                    value={formData.current_base_income || ''}
                    onChange={(e) => handleInputChange('current_base_income', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    placeholder="5000"
                  />
                  <p className="mt-1 text-xs text-gray-500">Your regular salary before taxes</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overtime
                  </label>
                  <input
                    type="number"
                    value={formData.current_overtime || ''}
                    onChange={(e) => handleInputChange('current_overtime', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    placeholder="500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Average if you work regular overtime</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bonus
                  </label>
                  <input
                    type="number"
                    value={formData.current_bonus || ''}
                    onChange={(e) => handleInputChange('current_bonus', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    placeholder="1000"
                  />
                  <p className="mt-1 text-xs text-gray-500">Monthly average of annual bonuses</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commission
                  </label>
                  <input
                    type="number"
                    value={formData.current_commission || ''}
                    onChange={(e) => handleInputChange('current_commission', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">Average monthly commission earnings</p>
                </div>
              </div>

              <div className="mt-4 bg-gradient-to-br from-red-50 to-cyan-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Monthly Income:</span>
                  <span className="text-2xl font-bold text-red-700">
                    ${(formData.current_total_monthly_income || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 2: Assets and Liabilities</h2>
              <p className="text-sm text-gray-600">Provide your total assets and monthly debt obligations</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Assets (Checking + Savings + Investments) *
              </label>
              <input
                type="number"
                value={formData.total_assets || ''}
                onChange={(e) => handleInputChange('total_assets', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                placeholder="50000"
              />
              <p className="mt-2 text-sm text-gray-500">
                Include all bank accounts, retirement accounts (401k, IRA), stocks, bonds, and other liquid assets
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Debt Obligations</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Monthly Debt Payments *
                </label>
                <input
                  type="number"
                  value={formData.total_monthly_debt || ''}
                  onChange={(e) => handleInputChange('total_monthly_debt', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="1200"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Include credit cards, car loans, student loans, personal loans, alimony, child support, and other monthly obligations
                </p>
              </div>

              {formData.current_total_monthly_income && formData.total_monthly_debt ? (
                <div className="mt-4 bg-gradient-to-br from-red-50 to-cyan-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">Debt-to-Income Ratio:</span>
                    <span className="text-2xl font-bold text-red-700">
                      {((formData.total_monthly_debt / formData.current_total_monthly_income) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {((formData.total_monthly_debt / formData.current_total_monthly_income) * 100) < 43
                      ? '✓ Your DTI is within the preferred 43% guideline'
                      : '⚠ Consider paying down debt to get below 43% for better approval odds'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 4: Loan and Property Information</h2>
              <p className="text-sm text-gray-600">Details about the property you're purchasing or refinancing</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Purpose *
                </label>
                <select
                  value={formData.loan_purpose || 'purchase'}
                  onChange={(e) => handleInputChange('loan_purpose', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="purchase">Purchase</option>
                  <option value="refinance">Refinance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.property_type || 'single_family'}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="2_4_units">2-4 Unit Property</option>
                  <option value="manufactured">Manufactured/Mobile Home</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Address *
              </label>
              <input
                type="text"
                value={formData.property_address || ''}
                onChange={(e) => handleInputChange('property_address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                placeholder="456 Oak Street"
              />
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.property_city || ''}
                  onChange={(e) => handleInputChange('property_city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.property_state || ''}
                  onChange={(e) => handleInputChange('property_state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.property_zip || ''}
                  onChange={(e) => handleInputChange('property_zip', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="94102"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Value *
                </label>
                <input
                  type="number"
                  value={formData.property_value || ''}
                  onChange={(e) => handleInputChange('property_value', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="450000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Down Payment *
                </label>
                <input
                  type="number"
                  value={formData.down_payment || ''}
                  onChange={(e) => handleInputChange('down_payment', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="90000"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Amount *
                </label>
                <input
                  type="number"
                  value={formData.loan_amount || ''}
                  onChange={(e) => handleInputChange('loan_amount', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                  placeholder="360000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Loan Type *</span>
                  <button
                    type="button"
                    onClick={() => setShowLoanTypeHelper(true)}
                    className="text-xs bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Help Me Choose
                  </button>
                </label>
                <select
                  value={formData.loan_type || 'conventional'}
                  onChange={(e) => handleInputChange('loan_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
                >
                  <option value="conventional">Conventional</option>
                  <option value="fha">FHA</option>
                  <option value="va">VA</option>
                  <option value="usda">USDA</option>
                  <option value="jumbo">Jumbo</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Not sure? Click "Help Me Choose" above for personalized guidance</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Occupancy Type *
              </label>
              <select
                value={formData.occupancy_type || 'primary_residence'}
                onChange={(e) => handleInputChange('occupancy_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent"
              >
                <option value="primary_residence">Primary Residence</option>
                <option value="second_home">Second Home</option>
                <option value="investment">Investment Property</option>
              </select>
            </div>

            {formData.loan_amount && formData.property_value ? (
              <div className="bg-gradient-to-br from-red-50 to-cyan-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">Loan-to-Value Ratio:</span>
                  <span className="text-2xl font-bold text-red-700">
                    {((formData.loan_amount / formData.property_value) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {((formData.loan_amount / formData.property_value) * 100) <= 80
                    ? '✓ No PMI required with this LTV'
                    : '⚠ PMI will be required (typically 0.5-1% of loan amount annually)'}
                </p>
              </div>
            ) : null}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 5: Declarations</h2>
              <p className="text-sm text-gray-600">These questions are required by federal law. Answer honestly - lenders will verify this information.</p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="outstanding_judgments"
                    checked={formData.outstanding_judgments || false}
                    onChange={(e) => handleInputChange('outstanding_judgments', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="outstanding_judgments" className="text-sm text-gray-700">
                    <span className="font-semibold">Are there any outstanding judgments against you?</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="bankruptcy"
                    checked={formData.bankruptcy_last_7_years || false}
                    onChange={(e) => handleInputChange('bankruptcy_last_7_years', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="bankruptcy" className="text-sm text-gray-700">
                    <span className="font-semibold">Have you declared bankruptcy within the past 7 years?</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="foreclosure"
                    checked={formData.foreclosure_last_7_years || false}
                    onChange={(e) => handleInputChange('foreclosure_last_7_years', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="foreclosure" className="text-sm text-gray-700">
                    <span className="font-semibold">Have you had property foreclosed upon in the last 7 years?</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="us_citizen"
                    checked={formData.us_citizen !== false}
                    onChange={(e) => handleInputChange('us_citizen', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="us_citizen" className="text-sm text-gray-700">
                    <span className="font-semibold">Are you a U.S. citizen?</span>
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>
                      Past financial difficulties don't automatically disqualify you from getting a mortgage.
                      Lenders consider the circumstances and how much time has passed. Honesty is essential -
                      false information can result in loan denial or legal consequences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Section 7: Military Service</h2>
              <p className="text-sm text-gray-600">Military service information helps determine VA loan eligibility</p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="currently_serving"
                    checked={formData.currently_serving || false}
                    onChange={(e) => handleInputChange('currently_serving', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="currently_serving" className="text-sm text-gray-700">
                    <span className="font-semibold">Are you currently serving on active duty?</span>
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="previously_served"
                    checked={formData.previously_served || false}
                    onChange={(e) => handleInputChange('previously_served', e.target.checked)}
                    className="w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-700 mt-1"
                  />
                  <label htmlFor="previously_served" className="text-sm text-gray-700">
                    <span className="font-semibold">Are you a veteran of the U.S. Armed Forces?</span>
                  </label>
                </div>
              </div>

              {(formData.currently_serving || formData.previously_served) && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-green-300 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-900">
                      <p className="font-semibold mb-1">VA Loan Benefits Available!</p>
                      <p>
                        As a service member or veteran, you may qualify for a VA loan with:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>0% down payment required</li>
                        <li>No PMI (Private Mortgage Insurance)</li>
                        <li>Competitive interest rates</li>
                        <li>Limited closing costs</li>
                        <li>More flexible credit requirements</li>
                      </ul>
                      <p className="mt-2">
                        Your loan officer will help you obtain your Certificate of Eligibility (COE).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!formData.currently_serving && !formData.previously_served && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Thank you for your response. We'll continue with other loan options that best fit your situation.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
              <p className="text-sm text-gray-600">Please review all information before submitting</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-cyan-50 rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-600 mb-3">BORROWER INFORMATION</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Name</div>
                    <div className="font-semibold text-gray-900">
                      {formData.borrower_first_name} {formData.borrower_last_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Email</div>
                    <div className="font-semibold text-gray-900">{formData.borrower_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Phone</div>
                    <div className="font-semibold text-gray-900">{formData.borrower_phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Current Address</div>
                    <div className="font-semibold text-gray-900">
                      {formData.borrower_current_address}, {formData.borrower_current_city}, {formData.borrower_current_state}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-600 mb-3">EMPLOYMENT & INCOME</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Employer</div>
                    <div className="font-semibold text-gray-900">{formData.current_employer_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Position</div>
                    <div className="font-semibold text-gray-900">{formData.current_position}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Monthly Income</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.current_total_monthly_income?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Years Employed</div>
                    <div className="font-semibold text-gray-900">{formData.current_years_employed}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-600 mb-3">FINANCIAL INFORMATION</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Total Assets</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.total_assets?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Monthly Debt</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.total_monthly_debt?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-600 mb-3">PROPERTY & LOAN DETAILS</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Property Address</div>
                    <div className="font-semibold text-gray-900">
                      {formData.property_address}, {formData.property_city}, {formData.property_state}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Property Value</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.property_value?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Loan Amount</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.loan_amount?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Loan Type</div>
                    <div className="font-semibold text-gray-900 uppercase">
                      {formData.loan_type}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Before you submit:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure all information is accurate and matches your documentation</li>
                  <li>Have recent pay stubs, tax returns, and bank statements ready</li>
                  <li>A loan officer will contact you within 24 hours to discuss next steps</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Residential Mortgage Application
          </h1>
          <p className="text-xl text-gray-600">
            Complete your comprehensive loan application with step-by-step guidance
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Application Progress</h2>
            <div className="text-sm text-gray-600">
              Section <span className="font-bold text-red-600">{step}</span> of {totalSteps}
            </div>
          </div>

          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-600 to-red-700 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setStep(section.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    step === section.id
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold text-center leading-tight">
                    {section.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-32">
          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-3 font-bold rounded-lg transition-all ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-6 py-3 font-bold rounded-lg transition-all ${
                  isStepValid()
                    ? 'bg-gradient-to-r from-red-700 to-red-800 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-red-700 to-red-800 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {showLoanTypeHelper && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-br from-red-700 to-red-800 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Loan Type Advisor</h3>
                      <p className="text-red-100 text-sm">Answer a few questions to get a personalized recommendation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLoanTypeHelper(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    Most borrowers aren't sure which loan type is best for them. Let me ask you a few quick questions to help you choose the right one!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Have you served in the military or are you currently on active duty?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, militaryService: true })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.militaryService === true
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, militaryService: false })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.militaryService === false
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Is this your first home purchase?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, firstTimeBuyer: true })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.firstTimeBuyer === true
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, firstTimeBuyer: false })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.firstTimeBuyer === false
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    What's your approximate credit score?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'below_620', label: 'Below 620' },
                      { value: '620_679', label: '620-679' },
                      { value: '680_739', label: '680-739' },
                      { value: '740_plus', label: '740+' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, creditScore: option.value })}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          loanTypeAnswers.creditScore === option.value
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    How much are you planning to put down?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'less_than_5', label: 'Less than 5%' },
                      { value: '5_10', label: '5-10%' },
                      { value: '10_20', label: '10-20%' },
                      { value: '20_plus', label: '20% or more' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, downPaymentPercent: option.value })}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          loanTypeAnswers.downPaymentPercent === option.value
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Is your property in a rural or suburban area?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, ruralProperty: true })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.ruralProperty === true
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setLoanTypeAnswers({ ...loanTypeAnswers, ruralProperty: false })}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                        loanTypeAnswers.ruralProperty === false
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    USDA loans are available for properties outside major metropolitan areas
                  </p>
                </div>

                {Object.keys(loanTypeAnswers).length >= 5 && (() => {
                  const rec = getLoanTypeRecommendation();
                  return (
                    <div className="border-t pt-6">
                      <div className={`bg-gradient-to-br ${rec.bgLight} border-2 ${rec.border} rounded-xl p-6`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${rec.bgGradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">
                              Recommended: {rec.title}
                            </h4>
                            <p className="text-gray-700 mb-1">
                              <span className={`inline-block px-2 py-1 ${rec.badge} text-xs font-bold rounded-full mb-2`}>
                                {rec.confidence}
                              </span>
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {rec.reason}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={applyLoanTypeRecommendation}
                          className="flex-1 bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-3 rounded-lg font-bold hover:from-red-800 hover:to-red-900 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Apply Recommendation
                        </button>
                        <button
                          onClick={() => setShowLoanTypeHelper(false)}
                          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all"
                        >
                          Choose Manually
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

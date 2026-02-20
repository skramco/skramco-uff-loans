import { Bot, User, Send, Loader, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MortgageApplication } from '../types';

interface ApplicationPageProps {
  onNavigate: (page: string) => void;
}

export default function ApplicationPage({ onNavigate }: ApplicationPageProps) {
  const [step, setStep] = useState(1);
  const [aiMode, setAiMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [showAiTip, setShowAiTip] = useState(true);

  const [formData, setFormData] = useState<Partial<MortgageApplication>>({
    applicant_name: '',
    email: '',
    phone: '',
    loan_amount: 0,
    property_value: 0,
    property_address: '',
    employment_status: 'employed',
    annual_income: 0,
    credit_score_range: '740+',
    loan_type: 'conventional',
    first_time_buyer: false,
    down_payment: 0,
    additional_notes: '',
  });

  const totalSteps = 4;

  const getAiTip = (currentStep: number, field?: string) => {
    const tips: Record<number, string> = {
      1: 'Hi! I\'m here to help make this process smooth. Let\'s start with your basic information. Make sure to use your legal name as it appears on your ID.',
      2: 'Great! Now let\'s talk about the property. The loan amount should be the property value minus your down payment. I\'ll help you determine the best loan type for your situation.',
      3: 'Almost there! Your employment and income information helps us determine what you can comfortably afford. Remember, we verify this information to protect you from overextending financially.',
      4: 'Final step! Review everything carefully. Once submitted, a loan officer will review your application and contact you within 24 hours. You can also add any questions or special circumstances in the notes.',
    };

    return tips[currentStep] || 'Let me know if you need any help!';
  };

  const handleInputChange = (field: keyof MortgageApplication, value: any) => {
    setFormData({ ...formData, [field]: value });

    if (aiMode) {
      setTimeout(() => {
        if (field === 'loan_amount' && value > 0) {
          const ltv = ((value / (formData.property_value || 1)) * 100).toFixed(0);
          setAiMessage(`💡 With a $${value.toLocaleString()} loan on a $${formData.property_value?.toLocaleString()} property, your LTV is ${ltv}%. ${Number(ltv) > 80 ? 'You may need PMI insurance.' : 'Great! No PMI needed.'}`);
          setShowAiTip(true);
        } else if (field === 'credit_score_range') {
          const scores: Record<string, string> = {
            '740+': 'Excellent! You\'ll qualify for the best interest rates.',
            '700-739': 'Good credit! You should get competitive rates.',
            '660-699': 'Fair credit. You\'ll still qualify, though rates may be slightly higher.',
            '620-659': 'You qualify! Consider FHA loans for better terms.',
            '580-619': 'FHA loans are a great option for your credit range.',
            'Below 580': 'Let\'s discuss specialized programs that can help you qualify.',
          };
          setAiMessage(`💡 ${scores[value as string]}`);
          setShowAiTip(true);
        } else if (field === 'first_time_buyer' && value === true) {
          setAiMessage('🎉 Great news! First-time buyers often qualify for special programs with lower down payments and better terms. I\'ll make sure we explore all your options!');
          setShowAiTip(true);
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setAiMessage(getAiTip(step + 1));
      setShowAiTip(true);
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
      const application: Partial<MortgageApplication> = {
        ...formData,
        status: 'submitted',
        ai_assistance_used: aiMode,
      };

      const { data, error } = await supabase
        .from('mortgage_applications')
        .insert([application])
        .select()
        .maybeSingle();

      if (error) throw error;

      const appNumber = data?.application_number || 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
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
              applicationType: 'simple',
              applicantName: formData.applicant_name,
              applicantEmail: formData.email,
              applicationNumber: appNumber,
              viewToken: viewToken,
              applicationData: {
                loanAmount: formData.loan_amount,
                propertyValue: formData.property_value,
                propertyAddress: formData.property_address,
                annualIncome: formData.annual_income,
                loanType: formData.loan_type,
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
        return formData.applicant_name && formData.email && formData.phone;
      case 2:
        return formData.loan_amount && formData.property_value && formData.property_address && formData.loan_type;
      case 3:
        return formData.employment_status && formData.annual_income && formData.credit_score_range;
      case 4:
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
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <div className="text-sm text-gray-600 mb-2">Your Application Number</div>
              <div className="text-3xl font-bold text-blue-700">{applicationNumber}</div>
            </div>

            <p className="text-lg text-gray-700 mb-4">
              Thank you for choosing HomeLoanAgents! A loan officer will review your application
              and contact you within 24 hours to discuss next steps.
            </p>

            <p className="text-sm text-gray-600 mb-8">
              A confirmation email has been sent to <strong>{formData.email}</strong>
            </p>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-700 mr-2" />
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-blue-700 mr-2">1.</span>
                  <span>We'll review your application and verify your information</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-700 mr-2">2.</span>
                  <span>A loan officer will contact you within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-700 mr-2">3.</span>
                  <span>We'll provide your pre-approval letter (typically 1-3 days)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-700 mr-2">4.</span>
                  <span>Start shopping for your dream home with confidence!</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('home')}
                className="px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition-all"
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

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mortgage Application
          </h1>
          <p className="text-xl text-gray-600">
            Complete your application with AI assistance or traditional form entry
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-gray-700">Assistance Mode:</span>
              <button
                onClick={() => {
                  setAiMode(!aiMode);
                  if (!aiMode) {
                    setAiMessage(getAiTip(step));
                    setShowAiTip(true);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  aiMode
                    ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {aiMode ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                <span className="font-semibold">{aiMode ? 'AI Assistant' : 'Traditional'}</span>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Step <span className="font-bold text-blue-700">{step}</span> of {totalSteps}
            </div>
          </div>

          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-700 to-blue-800 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {aiMode && showAiTip && (
          <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl p-6 mb-8 text-white shadow-lg animate-fadeIn">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-2 flex items-center">
                  AI Assistant
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">Real-time Help</span>
                </div>
                <p className="text-[#d9eef5]">
                  {aiMessage || getAiTip(step)}
                </p>
              </div>
              <button
                onClick={() => setShowAiTip(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.applicant_name}
                  onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Address *
                </label>
                <input
                  type="text"
                  value={formData.property_address}
                  onChange={(e) => handleInputChange('property_address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Value *
                  </label>
                  <input
                    type="number"
                    value={formData.property_value || ''}
                    onChange={(e) => handleInputChange('property_value', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                    placeholder="350000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Down Payment
                  </label>
                  <input
                    type="number"
                    value={formData.down_payment || ''}
                    onChange={(e) => handleInputChange('down_payment', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Amount Requested *
                </label>
                <input
                  type="number"
                  value={formData.loan_amount || ''}
                  onChange={(e) => handleInputChange('loan_amount', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="300000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loan Type *
                </label>
                <select
                  value={formData.loan_type}
                  onChange={(e) => handleInputChange('loan_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                >
                  <option value="conventional">Conventional</option>
                  <option value="fha">FHA</option>
                  <option value="va">VA</option>
                  <option value="usda">USDA</option>
                  <option value="jumbo">Jumbo</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="firstTimeBuyer"
                  checked={formData.first_time_buyer}
                  onChange={(e) => handleInputChange('first_time_buyer', e.target.checked)}
                  className="w-5 h-5 text-blue-700 border-gray-300 rounded focus:ring-2 focus:ring-blue-700"
                />
                <label htmlFor="firstTimeBuyer" className="text-sm font-semibold text-gray-700">
                  I am a first-time homebuyer
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Information</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employment Status *
                </label>
                <select
                  value={formData.employment_status}
                  onChange={(e) => handleInputChange('employment_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                >
                  <option value="employed">Employed</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Annual Income *
                </label>
                <input
                  type="number"
                  value={formData.annual_income || ''}
                  onChange={(e) => handleInputChange('annual_income', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="80000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Credit Score Range *
                </label>
                <select
                  value={formData.credit_score_range}
                  onChange={(e) => handleInputChange('credit_score_range', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                >
                  <option value="740+">740+ (Excellent)</option>
                  <option value="700-739">700-739 (Good)</option>
                  <option value="660-699">660-699 (Fair)</option>
                  <option value="620-659">620-659 (Fair)</option>
                  <option value="580-619">580-619 (Poor)</option>
                  <option value="Below 580">Below 580</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Applicant Name</div>
                    <div className="font-semibold text-gray-900">{formData.applicant_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Email</div>
                    <div className="font-semibold text-gray-900">{formData.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Phone</div>
                    <div className="font-semibold text-gray-900">{formData.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Property Value</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.property_value?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Loan Amount</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.loan_amount?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Loan Type</div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {formData.loan_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Annual Income</div>
                    <div className="font-semibold text-gray-900">
                      ${formData.annual_income?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Credit Score</div>
                    <div className="font-semibold text-gray-900">{formData.credit_score_range}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                  placeholder="Any questions or special circumstances we should know about?"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Before you submit:</p>
                  <p>
                    Please ensure all information is accurate. Our team will verify this information
                    as part of the approval process.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
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
      </div>
    </div>
  );
}

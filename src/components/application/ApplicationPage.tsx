import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApplicationForm } from '../../hooks/useApplicationForm';
import type { SectionKey } from '../../hooks/useApplicationForm';
import { createLoanInVesta } from '../../services/vestaService';
import { supabase } from '../../lib/supabase';
import WizardMode from './WizardMode';
import DirectMode from './DirectMode';
import ProtectedRoute from '../ProtectedRoute';
import { LayoutList, Wand2, CheckCircle, Home, ArrowLeft, FileText } from 'lucide-react';

type ViewMode = 'wizard' | 'direct';

interface Props {
  existingLoanId?: string;
  onNavigate?: (page: string) => void;
}

function ApplicationContent({ existingLoanId }: Props) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<ViewMode>('wizard');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    loanId,
    formData,
    currentStep,
    saving,
    loading,
    isSubmitted,
    lastSaved,
    setCurrentStep,
    updateSection,
    saveAndAdvance,
    goBack,
    submitApplication,
  } = useApplicationForm(existingLoanId);

  async function handleSubmit() {
    setSubmitError('');
    setSubmitting(true);

    try {
      const { success, error } = await submitApplication();
      if (!success) throw new Error(error || 'Failed to submit');

      if (loanId) {
        const vestaPayload = {
          borrowerFirstName: formData.personalInfo?.firstName,
          borrowerLastName: formData.personalInfo?.lastName,
          borrowerEmail: formData.personalInfo?.email,
          loanAmount: formData.loanDetails?.loanAmount,
          propertyAddress: formData.property?.address,
          loanType: formData.loanDetails?.loanType,
          loanPurpose: formData.loanDetails?.loanPurpose,
          propertyValue: formData.property?.propertyValue,
          applicationData: formData,
        };

        const vestaResult = await createLoanInVesta(vestaPayload);

        if (vestaResult.vestaLoanId) {
          await supabase
            .from('loans')
            .update({ vesta_loan_id: vestaResult.vestaLoanId })
            .eq('id', loanId);
        }

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
                applicantName: `${formData.personalInfo?.firstName} ${formData.personalInfo?.lastName}`,
                applicantEmail: formData.personalInfo?.email,
                applicationNumber: loanId,
                applicationData: {
                  loanAmount: formData.loanDetails?.loanAmount,
                  propertyValue: formData.property?.propertyValue,
                  propertyAddress: formData.property?.address,
                  monthlyIncome: formData.employment?.totalMonthlyIncome,
                  loanType: formData.loanDetails?.loanType,
                  employerName: formData.employment?.employerName,
                },
              }),
            }
          );
          if (!emailResponse.ok) {
            console.error('Email send failed:', await emailResponse.text());
          }
        } catch (emailErr) {
          console.error('Email error:', emailErr);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleUpdateSection(section: SectionKey, field: string, value: any) {
    updateSection(section, field, value);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (submitted || isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Your loan application has been received and is being reviewed. We'll contact you shortly with next steps.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What Happens Next</h3>
            <div className="space-y-3">
              {['Our team will review your application within 24-48 hours',
                'A loan officer will reach out to discuss your options',
                'You may be asked to provide additional documentation',
                'Check your dashboard for status updates'].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </a>
            {loanId && (
              <a
                href={`/loan/${loanId}`}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Loan
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </a>
              <FileText className="w-5 h-5 text-red-600" />
              <h1 className="text-lg font-bold text-gray-900">Loan Application</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-lg p-0.5 flex">
                <button
                  onClick={() => setMode('wizard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'wizard'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Guided
                </button>
                <button
                  onClick={() => setMode('direct')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'direct'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  Full Form
                </button>
              </div>
              <span className="text-sm text-gray-500 hidden md:block">
                {profile?.first_name} {profile?.last_name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {submitError}
          </div>
        )}

        {mode === 'wizard' ? (
          <WizardMode
            formData={formData}
            currentStep={currentStep}
            saving={saving}
            lastSaved={lastSaved}
            onUpdateSection={handleUpdateSection}
            onNext={saveAndAdvance}
            onBack={goBack}
            onGoToStep={setCurrentStep}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        ) : (
          <DirectMode
            formData={formData}
            saving={saving}
            lastSaved={lastSaved}
            onUpdateSection={handleUpdateSection}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

export default function ApplicationPage(props: Props) {
  return (
    <ProtectedRoute>
      <ApplicationContent {...props} />
    </ProtectedRoute>
  );
}

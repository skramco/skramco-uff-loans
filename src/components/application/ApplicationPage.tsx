import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApplicationForm } from '../../hooks/useApplicationForm';
import type { SectionKey } from '../../hooks/useApplicationForm';
import { createLoanInVesta } from '../../services/vestaService';
import { supabase } from '../../lib/supabase';
import WizardMode from './WizardMode';
import DirectMode from './DirectMode';
import ProtectedRoute from '../ProtectedRoute';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutList, Wand2, CheckCircle, Home, FileText, Save, PartyPopper, Sparkles, Mail, Shield, DollarSign, MapPin, Briefcase, User } from 'lucide-react';
import ComplianceFooter from '../layout/ComplianceFooter';
import confetti from 'canvas-confetti';

type ViewMode = 'wizard' | 'direct';

interface Props {
  existingLoanId?: string;
  onNavigate?: (page: string) => void;
}

function ApplicationContent({ existingLoanId }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('wizard');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savingExit, setSavingExit] = useState(false);

  const {
    loanId,
    tempLoanNumber,
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
    saveLoan,
  } = useApplicationForm(existingLoanId);

  // If the loan was already submitted (loaded from DB on return visit), redirect to dashboard
  useEffect(() => {
    if (isSubmitted && !submitted) {
      navigate('/my-loan', { replace: true });
    }
  }, [isSubmitted, submitted, navigate]);

  async function handleSaveAndExit() {
    setSavingExit(true);
    try {
      await saveLoan(formData, currentStep);
    } catch (err) {
      console.error('Error saving before exit:', err);
    }
    setSavingExit(false);
    navigate('/');
  }

  async function handleSubmit() {
    setSubmitError('');
    setSubmitting(true);

    try {
      const result = await submitApplication();
      if (!result.success) throw new Error(result.error || 'Failed to submit');

      const activeLoanId = result.loanId || loanId;

      if (activeLoanId) {
        // Submit to Vesta
        try {
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
              .eq('id', activeLoanId);
          }
        } catch (vestaErr) {
          console.error('Vesta error (non-blocking):', vestaErr);
        }

        // Send confirmation email
        try {
          const propertyAddr = formData.property?.address
            ? [formData.property.address, formData.property.city, formData.property.state, formData.property.zip].filter(Boolean).join(', ')
            : undefined;

          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-application-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                applicationType: 'urla',
                applicantName: `${formData.personalInfo?.firstName || ''} ${formData.personalInfo?.lastName || ''}`.trim(),
                applicantEmail: formData.personalInfo?.email,
                applicationNumber: activeLoanId,
                applicationData: {
                  loanAmount: formData.loanDetails?.loanAmount,
                  loanPurpose: formData.loanDetails?.loanPurpose,
                  loanType: formData.loanDetails?.loanType,
                  propertyValue: formData.property?.propertyValue,
                  propertyAddress: propertyAddr,
                  propertyCity: formData.property?.city,
                  propertyState: formData.property?.state,
                  monthlyIncome: formData.employment?.totalMonthlyIncome,
                  employerName: formData.employment?.employerName,
                  totalAssets: formData.assets?.totalAssets,
                  totalMonthlyDebt: formData.liabilities?.totalMonthlyDebt,
                  downPayment: formData.loanDetails?.downPayment,
                },
              }),
            }
          );
        } catch (emailErr) {
          console.error('Email error (non-blocking):', emailErr);
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

  if (submitted) {
    return <SubmissionSuccess formData={formData} loanId={loanId} tempLoanNumber={tempLoanNumber} />;
  }

  if (isSubmitted) {
    // Will redirect via useEffect above; show nothing while redirecting
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex-shrink-0">
                <img src="/uff_logo.svg" alt="UFF" className="h-8 w-auto" />
              </Link>
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              <h1 className="text-lg font-bold text-gray-900 hidden sm:block">Loan Application</h1>
              {tempLoanNumber && (
                <span className="text-xs font-mono bg-red-50 text-red-700 px-2 py-1 rounded-md border border-red-100">
                  {tempLoanNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
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
                  <span className="hidden sm:inline">Guided</span>
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
                  <span className="hidden sm:inline">Full Form</span>
                </button>
              </div>

              {/* Save & Exit */}
              <button
                onClick={handleSaveAndExit}
                disabled={savingExit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{savingExit ? 'Saving...' : 'Save & Exit'}</span>
              </button>

              {/* User name */}
              <span className="text-sm text-gray-500 hidden lg:block">
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
      <ComplianceFooter className="mt-auto" />
    </div>
  );
}

function SubmissionSuccess({
  formData,
  loanId,
  tempLoanNumber,
}: {
  formData: any;
  loanId: string | null;
  tempLoanNumber: string | null;
}) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    // Initial big burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
    });

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#dc2626', '#f59e0b', '#10b981'],
      });
    }, 300);

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
      });
    }, 500);

    // Gentle rain
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 160,
        origin: { y: 0 },
        gravity: 0.6,
        ticks: 300,
        colors: ['#dc2626', '#f59e0b', '#10b981', '#3b82f6'],
      });
    }, 1000);
  }, []);

  const pi = formData.personalInfo || {};
  const ld = formData.loanDetails || {};
  const pr = formData.property || {};
  const emp = formData.employment || {};

  const allCards = [
    {
      icon: User,
      label: 'Borrower',
      value: [pi.firstName, pi.lastName].filter(Boolean).join(' '),
      sub: pi.email || '',
      always: true,
    },
    {
      icon: DollarSign,
      label: 'Loan Amount',
      value: ld.loanAmount ? `$${ld.loanAmount.toLocaleString()}` : '',
      sub: ld.loanPurpose || '',
      always: false,
    },
    {
      icon: MapPin,
      label: 'Property',
      value: [pr.city, pr.state].filter(Boolean).join(', '),
      sub: pr.propertyValue ? `Value: $${pr.propertyValue.toLocaleString()}` : '',
      always: false,
    },
    {
      icon: Briefcase,
      label: 'Employment',
      value: emp.employerName || '',
      sub: emp.totalMonthlyIncome ? `$${emp.totalMonthlyIncome.toLocaleString()}/mo` : '',
      always: false,
    },
  ];

  const summaryCards = allCards.filter((c) => c.always || c.value || c.sub);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Hero celebration */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 shadow-lg shadow-green-200 animate-bounce">
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
              You did it!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Your loan application has been submitted successfully.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 rounded-full px-4 py-2 mx-auto w-fit">
              <CheckCircle className="w-4 h-4" />
              <span>Application received &mdash; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {tempLoanNumber && (
              <p className="mt-3 text-sm text-gray-500">
                Reference: <span className="font-mono font-semibold text-gray-700">{tempLoanNumber}</span>
              </p>
            )}
          </div>

          {/* Summary cards — only show cards with data */}
          {summaryCards.length > 0 && (
            <div className={`grid gap-3 mb-8 ${summaryCards.length <= 2 ? 'grid-cols-2' : summaryCards.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {summaryCards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                  <card.icon className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{card.label}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{card.value || 'Provided'}</p>
                  {card.sub && <p className="text-xs text-gray-500 truncate">{card.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Email confirmation */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Confirmation email sent</h3>
                <p className="text-sm text-gray-600">
                  We've sent a summary of your application to <span className="font-medium text-gray-900">{pi.email || 'your email'}</span>.
                  Check your inbox for a detailed breakdown of everything you submitted.
                </p>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              What happens next
            </h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Application Review', desc: 'Our team reviews your application within 24-48 hours', time: 'Today' },
                { step: '2', title: 'Loan Officer Contact', desc: 'A dedicated loan officer will reach out to discuss your options', time: '1-2 days' },
                { step: '3', title: 'Documentation', desc: 'You may be asked to provide supporting documents (pay stubs, tax returns, etc.)', time: '3-5 days' },
                { step: '4', title: 'Approval & Closing', desc: 'Once approved, we\'ll guide you through closing', time: '2-4 weeks' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              to="/"
              className="flex-1 bg-red-600 text-white px-4 py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            {loanId && (
              <Link
                to={`/loan/${loanId}`}
                className="flex-1 bg-white text-gray-700 px-4 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                View Application
              </Link>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Your information is secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
      <ComplianceFooter />
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

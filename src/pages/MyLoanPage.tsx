import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBorrowerSession } from '../contexts/BorrowerSessionContext';
import { supabase } from '../lib/supabase';
import ComplianceFooter from '../components/layout/ComplianceFooter';

// Existing Vesta-powered dashboard components
import LoanOverview from '../components/borrower/LoanOverview';
import MonthlyPayment from '../components/borrower/MonthlyPayment';
import RateDetails from '../components/borrower/RateDetails';
import LoanOfficerCard from '../components/borrower/LoanOfficerCard';
import FinancialSummary from '../components/borrower/FinancialSummary';
import CashToClose from '../components/borrower/CashToClose';
import KeyDates from '../components/borrower/KeyDates';
import BorrowerInfo from '../components/borrower/BorrowerInfo';
import PropertyDetails from '../components/borrower/PropertyDetails';
import LoanConditions from '../components/borrower/LoanConditions';
import PreApprovalSection from '../components/borrower/PreApprovalSection';

import {
  CheckCircle2,
  Circle,
  Clock,
  LogOut,
  User,
  DollarSign,
  MapPin,
  Briefcase,
  FileText,
  Phone,
  Mail,
  Shield,
  Home,
  AlertCircle,
  Loader2,
  Upload,
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  Info,
  Award,
} from 'lucide-react';

/* ─── Types ─── */
interface SupabaseLoan {
  id: string;
  temp_loan_number: string | null;
  status: string;
  is_submitted: boolean;
  loan_application_data: any;
  created_at: string;
  updated_at: string;
  vesta_loan_id: string | null;
}

interface ConditionRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  responsible_party: string;
  due_date: string | null;
}

/* ─── Pipeline stages ─── */
const PIPELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', desc: 'Your application has been received and is in queue for review.' },
  { key: 'review', label: 'Initial Review', desc: 'Your loan officer is reviewing your application and may reach out with questions.' },
  { key: 'processing', label: 'Processing', desc: 'Your documents are being verified and your file is being prepared for underwriting.' },
  { key: 'underwriting', label: 'Underwriting', desc: 'An underwriter is evaluating your file for final approval.' },
  { key: 'approved', label: 'Conditional Approval', desc: "You're approved pending a few final items. Your loan officer will walk you through each one." },
  { key: 'closing', label: 'Clear to Close', desc: 'All conditions are met. Your closing is being scheduled!' },
];

function resolveStageIndex(status: string, vestaStage?: string): number {
  const raw = (vestaStage || status || '').toLowerCase();
  if (raw.includes('fund') || raw.includes('post clos')) return 5;
  if (raw.includes('close') || raw.includes('clear') || raw.includes('ctc') || raw.includes('doc')) return 5;
  if (raw.includes('approv') || raw.includes('conditional')) return 4;
  if (raw.includes('underw')) return 3;
  if (raw.includes('process')) return 2;
  if (raw.includes('review') || raw.includes('origination')) return 1;
  return 0;
}

/* ─── Tab config ─── */
const ALL_TABS = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'financials' as const, label: 'Financials', icon: CreditCard },
  { id: 'conditions' as const, label: 'Conditions', icon: ClipboardList },
  { id: 'details' as const, label: 'Details', icon: Info },
  { id: 'preapproval' as const, label: 'Pre-Approval', icon: Award },
];
type TabId = typeof ALL_TABS[number]['id'];

const fmtCurrency = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : null;

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function MyLoanPage() {
  const { user, profile, signOut } = useAuth();
  const { session: vestaSession, logout: vestaLogout } = useBorrowerSession();
  const navigate = useNavigate();

  const [sbLoan, setSbLoan] = useState<SupabaseLoan | null>(null);
  const [sbConditions, setSbConditions] = useState<ConditionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const vestaLoan = vestaSession?.loan || null;
  const hasVesta = !!vestaLoan;

  useEffect(() => {
    if (!user && !vestaSession) {
      navigate('/login', { replace: true });
      return;
    }
    loadSupabaseLoan();
  }, [user, vestaSession]);

  async function loadSupabaseLoan() {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('loans').select('*')
        .eq('borrower_id', user.id).eq('is_submitted', true)
        .order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data && !vestaLoan) { navigate('/apply', { replace: true }); return; }
      if (data) {
        setSbLoan(data);
        const { data: conds } = await supabase
          .from('conditions').select('*').eq('loan_id', data.id)
          .order('created_at', { ascending: true });
        setSbConditions(conds || []);
      }
    } catch (err) { console.error('Error loading loan:', err); }
    finally { setLoading(false); }
  }

  const handleSignOut = async () => {
    if (vestaSession) vestaLogout();
    if (user) await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your loan...</p>
        </div>
      </div>
    );
  }

  if (!sbLoan && !vestaLoan) return null;

  /* ─── Derive display data from best source ─── */
  const appData = sbLoan?.loan_application_data || {};
  const pi = appData.personalInfo || {};
  const ld = appData.loanDetails || {};
  const pr = appData.property || {};
  const emp = appData.employment || {};

  const borrowerFirstName = hasVesta
    ? (vestaLoan.borrowers?.[0]?.firstName || '')
    : (pi.firstName || profile?.first_name || '');
  const borrowerFullName = hasVesta
    ? (vestaLoan.borrowers?.[0]?.fullName || [vestaLoan.borrowers?.[0]?.firstName, vestaLoan.borrowers?.[0]?.lastName].filter(Boolean).join(' '))
    : ([pi.firstName, pi.lastName].filter(Boolean).join(' ') || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim());

  const loanNumber = hasVesta ? vestaLoan.loanNumber : sbLoan?.temp_loan_number;
  const loanAmount = hasVesta ? vestaLoan.loanAmount : ld.loanAmount;
  const loanPurpose = hasVesta ? vestaLoan.loanPurpose : ld.loanPurpose;
  const loanType = hasVesta ? (vestaLoan.loanProduct?.mortgageType || vestaLoan.loanType) : ld.loanType;
  const displayStatus = hasVesta ? (vestaLoan.currentLoanStage || sbLoan?.status || 'Submitted') : (sbLoan?.status || 'Submitted');
  const currentStageIdx = resolveStageIndex(sbLoan?.status || '', hasVesta ? vestaLoan.currentLoanStage : undefined);

  const submittedDate = sbLoan
    ? new Date(sbLoan.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const openConditions = sbConditions.filter((c) => c.status === 'Open' && c.responsible_party === 'Borrower');
  const clearedConditions = sbConditions.filter((c) => c.status === 'Cleared');

  // Only show tabs that have data
  const visibleTabs = ALL_TABS.filter((t) => {
    if (t.id === 'financials') return hasVesta;
    if (t.id === 'preapproval') return hasVesta;
    return true;
  });

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-gray-900 hover:text-gray-700 transition-colors">
            <img src="/uff_logo.svg" alt="UFF Logo" className="h-8 w-auto" />
            <div className="h-6 w-px bg-gray-200" />
            <span className="font-bold text-sm">Loan Command Center</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{borrowerFullName}</span>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {borrowerFirstName || 'Borrower'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's the latest on {loanPurpose?.toLowerCase()?.includes('purchase') ? 'your new home' : 'your loan'}.
          </p>
        </div>

        {/* ─── Loan Hero Banner ─── */}
        {hasVesta ? (
          <LoanOverview loan={vestaLoan} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  {loanNumber && <p className="text-slate-400 text-sm mb-1">Ref #{loanNumber}</p>}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{fmtCurrency(loanAmount) || 'Loan Submitted'}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {loanType && <span className="text-slate-300 text-sm">{loanType}</span>}
                    {loanPurpose && <><span className="text-slate-500">|</span><span className="text-slate-300 text-sm">{loanPurpose}</span></>}
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  {displayStatus}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
              {[
                { label: 'Loan Amount', value: fmtCurrency(loanAmount), icon: DollarSign, accent: 'text-red-600 bg-red-50' },
                { label: 'Property Value', value: fmtCurrency(pr.propertyValue), icon: Home, accent: 'text-emerald-600 bg-emerald-50' },
                { label: 'Down Payment', value: fmtCurrency(ld.downPayment), icon: DollarSign, accent: 'text-teal-600 bg-teal-50' },
                { label: 'Submitted', value: submittedDate, icon: Clock, accent: 'text-amber-600 bg-amber-50' },
              ].filter(s => s.value).map((stat) => (
                <div key={stat.label} className="px-4 py-5 sm:px-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.accent}`}>
                      <stat.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Pizza Tracker ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Loan Progress</h3>

          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div className="absolute top-4 left-0 h-0.5 bg-red-600 z-0 transition-all duration-500"
                style={{ width: currentStageIdx >= 0 ? `${(currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100}%` : '0%' }} />
              {PIPELINE_STAGES.map((stage, idx) => {
                const done = idx < currentStageIdx;
                const active = idx === currentStageIdx;
                return (
                  <div key={stage.key} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / PIPELINE_STAGES.length}%` }}>
                    {done ? (
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
                    ) : active ? (
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center ring-4 ring-red-100"><Clock className="w-4 h-4 text-white" /></div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center"><Circle className="w-3 h-3 text-gray-300" /></div>
                    )}
                    <span className={`mt-2 text-xs font-medium text-center leading-tight px-1 ${active ? 'text-red-700 font-semibold' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">Current Stage: {PIPELINE_STAGES[currentStageIdx]?.label}</p>
              <p className="text-sm text-red-700">{PIPELINE_STAGES[currentStageIdx]?.desc}</p>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-0">
            {PIPELINE_STAGES.map((stage, idx) => {
              const done = idx < currentStageIdx;
              const active = idx === currentStageIdx;
              const isLast = idx === PIPELINE_STAGES.length - 1;
              return (
                <div key={stage.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                    ) : active ? (
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 ring-4 ring-red-100"><Clock className="w-3.5 h-3.5 text-white" /></div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0"><Circle className="w-3 h-3 text-gray-300" /></div>
                    )}
                    {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] ${done ? 'bg-red-600' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-5">
                    <p className={`text-sm ${active ? 'text-red-700 font-semibold' : done ? 'text-gray-700' : 'text-gray-400'}`}>{stage.label}</p>
                    {active && <p className="text-xs text-red-600 mt-1 leading-relaxed">{stage.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === 'overview' && (
          <OverviewContent
            hasVesta={hasVesta} vestaLoan={vestaLoan}
            pi={pi} ld={ld} pr={pr} emp={emp}
            sbConditions={sbConditions} openConditions={openConditions} clearedConditions={clearedConditions}
          />
        )}
        {activeTab === 'financials' && hasVesta && (
          <div className="space-y-6">
            <FinancialSummary loan={vestaLoan} />
            <div className="grid lg:grid-cols-2 gap-6">
              <CashToClose loan={vestaLoan} />
              <KeyDates loan={vestaLoan} />
            </div>
          </div>
        )}
        {activeTab === 'conditions' && (
          <ConditionsContent hasVesta={hasVesta} vestaLoan={vestaLoan} sbConditions={sbConditions} openConditions={openConditions} clearedConditions={clearedConditions} />
        )}
        {activeTab === 'details' && (
          <DetailsContent hasVesta={hasVesta} vestaLoan={vestaLoan} pi={pi} ld={ld} pr={pr} emp={emp} />
        )}
        {activeTab === 'preapproval' && hasVesta && (
          <PreApprovalSection loan={vestaLoan} />
        )}
      </div>

      <ComplianceFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════ */
function OverviewContent({ hasVesta, vestaLoan, pi, ld, pr, emp, sbConditions, openConditions, clearedConditions }: any) {
  return (
    <div className="space-y-6">
      {/* Row 1: Monthly Payment / Rate & Loan Details / Loan Officer — same layout for both paths */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Card 1: Monthly Payment */}
        {hasVesta ? (
          <MonthlyPayment loan={vestaLoan} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Monthly Payment</h3>
            <p className="text-sm text-gray-500 mb-6">Estimated total housing expense</p>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-gray-300">—</p>
              <p className="text-sm text-gray-400 mt-1">per month</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Being Calculated</p>
              <p className="text-xs text-gray-400 mt-1">Your loan officer will finalize your payment estimate based on current rates and your loan details.</p>
            </div>
          </div>
        )}

        {/* Card 2: Rate & Loan Details */}
        {hasVesta ? (
          <RateDetails loan={vestaLoan} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Rate & Loan Details</h3>
            <p className="text-sm text-gray-500 mb-6">Your loan terms and product info</p>
            <div className="space-y-3">
              {ld.loanAmount && (
                <div className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Loan Amount</span>
                  <span className="text-sm font-medium text-gray-900">{fmtCurrency(ld.loanAmount)}</span>
                </div>
              )}
              {ld.loanType && (
                <div className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Loan Type</span>
                  <span className="text-sm font-medium text-gray-900">{ld.loanType}</span>
                </div>
              )}
              {ld.loanPurpose && (
                <div className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Purpose</span>
                  <span className="text-sm font-medium text-gray-900">{ld.loanPurpose}</span>
                </div>
              )}
              {ld.downPayment && (
                <div className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Down Payment</span>
                  <span className="text-sm font-medium text-gray-900">{fmtCurrency(ld.downPayment)}</span>
                </div>
              )}
              {pr.propertyValue && (
                <div className="flex items-start justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Property Value</span>
                  <span className="text-sm font-medium text-gray-900">{fmtCurrency(pr.propertyValue)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">Rate and product details will appear once your loan officer locks your rate.</p>
            </div>
          </div>
        )}

        {/* Card 3: Loan Officer */}
        {hasVesta ? (
          <LoanOfficerCard loan={vestaLoan} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Your Loan Officer</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                LO
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Being Assigned</p>
                <p className="text-xs text-gray-500">Your dedicated LO will reach out shortly</p>
              </div>
            </div>
            <div className="space-y-3">
              <a href="tel:+18559532453" className="flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <Phone className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                </div>
                (855) 89-EAGLE
              </a>
              <a href="mailto:loans@uff.loans" className="flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <Mail className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                </div>
                loans@uff.loans
              </a>
            </div>
            <div className="flex items-start gap-2 mt-4 pt-3 border-t border-gray-100">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">Your information is encrypted with bank-level security.</p>
            </div>
          </div>
        )}
      </div>

      {/* Application snapshot — Supabase only (shows borrower/property/employment at a glance) */}
      {!hasVesta && (pi.firstName || pr.address || emp.employerName) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Snapshot</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={User} label="Borrower" title={[pi.firstName, pi.lastName].filter(Boolean).join(' ') || 'N/A'} sub1={pi.email} sub2={pi.phone} />
            <SummaryCard icon={DollarSign} label="Loan" title={fmtCurrency(ld.loanAmount) || 'N/A'} sub1={[ld.loanPurpose, ld.loanType].filter(Boolean).join(' • ')} />
            {(pr.address || pr.city) && (
              <SummaryCard icon={MapPin} label="Property" title={pr.address || [pr.city, pr.state].filter(Boolean).join(', ')}
                sub1={pr.propertyValue ? `Value: ${fmtCurrency(pr.propertyValue)}` : undefined} sub2={pr.propertyType} />
            )}
            {emp.employerName && (
              <SummaryCard icon={Briefcase} label="Employment" title={emp.employerName}
                sub1={emp.position} sub2={emp.totalMonthlyIncome ? `${fmtCurrency(emp.totalMonthlyIncome)}/mo` : undefined} />
            )}
          </div>
        </div>
      )}

      {/* Conditions quick-glance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Conditions &amp; Checklist</h3>
          {sbConditions.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-medium">{clearedConditions.length} cleared</span>
              <span className="text-gray-300">|</span>
              <span className="text-amber-600 font-medium">{openConditions.length} action needed</span>
            </div>
          )}
        </div>
        {sbConditions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">No conditions yet</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Your loan officer will add conditions here once they've reviewed your application. You'll be notified when items need your attention.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sbConditions.slice(0, 5).map((c: any) => (
              <ConditionItem key={c.id} c={c as ConditionRow} />
            ))}
            {sbConditions.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">+ {sbConditions.length - 5} more — see Conditions tab</p>
            )}
          </div>
        )}
      </div>

      {/* What to Expect — shown for both paths */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{hasVesta ? 'Next Steps' : 'What to Expect'}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasVesta ? (
            <>
              <ExpectCard icon={ClipboardList} color="red" title="Review Conditions" desc="Check the Conditions tab for any items that need your attention or documents to upload." />
              <ExpectCard icon={Upload} color="red" title="Upload Documents" desc="Submit any requested documents directly through the Conditions tab — fast and secure." />
              <ExpectCard icon={Mail} color="red" title="Stay in Touch" desc="Your loan officer will keep you updated. Reach out anytime with questions." />
              <ExpectCard icon={Home} color="green" title="Closing Day" desc="Once all conditions are cleared, your closing will be scheduled. Almost there!" />
            </>
          ) : (
            <>
              <ExpectCard icon={Phone} color="red" title="Phone Call" desc="Your loan officer will call to introduce themselves and discuss your application." />
              <ExpectCard icon={Upload} color="red" title="Document Requests" desc="We'll send a personalized checklist of documents needed. Upload them right here." />
              <ExpectCard icon={Mail} color="red" title="Regular Updates" desc="You'll receive email and text updates at every stage. No guesswork." />
              <ExpectCard icon={Home} color="green" title="Closing Day" desc="We'll guide you through every step of closing. Typical timeline: 20-30 days." />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CONDITIONS TAB
   ═══════════════════════════════════════════════════ */
function ConditionsContent({ hasVesta, vestaLoan, sbConditions, openConditions, clearedConditions }: any) {
  // If Vesta data is available, use the rich Vesta conditions component
  if (hasVesta) {
    return <LoanConditions loan={vestaLoan} />;
  }

  // Otherwise show Supabase conditions
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan Conditions</h3>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of items needed for your loan</p>
        </div>
        {sbConditions.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">{clearedConditions.length} cleared</span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-600 font-medium">{openConditions.length} action needed</span>
          </div>
        )}
      </div>
      {sbConditions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h4 className="text-base font-semibold text-gray-900 mb-1">No Conditions Yet</h4>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Conditions will appear here once your loan officer has reviewed your application. You'll be notified when items need your attention.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sbConditions.map((c: any) => <ConditionItem key={c.id} c={c as ConditionRow} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DETAILS TAB
   ═══════════════════════════════════════════════════ */
function DetailsContent({ hasVesta, vestaLoan, pi, ld, pr, emp }: any) {
  if (hasVesta) {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <BorrowerInfo loan={vestaLoan} />
          <PropertyDetails loan={vestaLoan} />
        </div>
      </div>
    );
  }

  // Supabase-only details
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Borrower */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Borrower Information</h3>
          <div className="space-y-3">
            {pi.firstName && <DetailRow icon={<User className="w-4 h-4" />} label="Name" value={[pi.firstName, pi.lastName].filter(Boolean).join(' ')} />}
            {pi.email && <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={pi.email} />}
            {pi.phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={pi.phone} />}
            {emp.employerName && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Employer" value={emp.employerName} />}
            {emp.position && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Position" value={emp.position} />}
            {emp.totalMonthlyIncome && <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Monthly Income" value={fmtCurrency(emp.totalMonthlyIncome) || ''} />}
          </div>
        </div>

        {/* Property & Loan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Loan &amp; Property Details</h3>
          <div className="space-y-3">
            {ld.loanAmount && <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Loan Amount" value={fmtCurrency(ld.loanAmount) || ''} />}
            {ld.loanType && <DetailRow icon={<FileText className="w-4 h-4" />} label="Loan Type" value={ld.loanType} />}
            {ld.loanPurpose && <DetailRow icon={<FileText className="w-4 h-4" />} label="Purpose" value={ld.loanPurpose} />}
            {ld.downPayment && <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Down Payment" value={fmtCurrency(ld.downPayment) || ''} />}
            {pr.address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Property Address" value={[pr.address, pr.city, pr.state, pr.zip].filter(Boolean).join(', ')} />}
            {pr.propertyValue && <DetailRow icon={<Home className="w-4 h-4" />} label="Property Value" value={fmtCurrency(pr.propertyValue) || ''} />}
            {pr.propertyType && <DetailRow icon={<Home className="w-4 h-4" />} label="Property Type" value={pr.propertyType} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */
function SummaryCard({ icon: Icon, label, title, sub1, sub2 }: { icon: any; label: string; title: string; sub1?: string; sub2?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
        {sub1 && <p className="text-xs text-gray-500 truncate">{sub1}</p>}
        {sub2 && <p className="text-xs text-gray-500 truncate">{sub2}</p>}
      </div>
    </div>
  );
}

function ConditionItem({ c }: { c: ConditionRow }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      c.status === 'Cleared' ? 'bg-green-50 border-green-100'
        : c.status === 'Submitted' ? 'bg-blue-50 border-blue-100'
        : 'bg-amber-50 border-amber-100'
    }`}>
      {c.status === 'Cleared' ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        : c.status === 'Submitted' ? <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        : <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{c.title}</p>
        {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
        c.status === 'Cleared' ? 'bg-green-100 text-green-700'
          : c.status === 'Submitted' ? 'bg-blue-100 text-blue-700'
          : 'bg-amber-100 text-amber-700'
      }`}>
        {c.status === 'Open' ? 'Action Needed' : c.status}
      </span>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function ExpectCard({ icon: Icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color === 'green' ? 'bg-green-100' : 'bg-red-100'}`}>
        <Icon className={`w-4 h-4 ${color === 'green' ? 'text-green-600' : 'text-red-600'}`} />
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

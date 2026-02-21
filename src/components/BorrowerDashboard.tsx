import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBorrowerSession } from '../contexts/BorrowerSessionContext';
import { supabase } from '../lib/supabase';
import { Loan, Condition } from '../types';
import {
  Home,
  FileText,
  AlertCircle,
  ChevronRight,
  LogOut,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Edit3,
} from 'lucide-react';
import ProtectedRoute from './ProtectedRoute';
import LoanOverview from './borrower/LoanOverview';
import LoanTimeline from './borrower/LoanTimeline';
import MonthlyPayment from './borrower/MonthlyPayment';
import RateDetails from './borrower/RateDetails';
import PropertyDetails from './borrower/PropertyDetails';
import CashToClose from './borrower/CashToClose';
import FinancialSummary from './borrower/FinancialSummary';
import LoanOfficerCard from './borrower/LoanOfficerCard';
import BorrowerInfo from './borrower/BorrowerInfo';
import KeyDates from './borrower/KeyDates';
import LoanConditions from './borrower/LoanConditions';
import PreApprovalSection from './borrower/PreApprovalSection';

function VestaDashboard() {
  const { session, logout } = useBorrowerSession();
  const loan = session?.loan;
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'conditions' | 'details' | 'preapproval'>('overview');

  function handleSignOut() {
    logout();
    window.location.href = '/login';
  }

  if (!loan) return null;

  const borrowerName =
    loan.primaryBorrowerFullName ||
    loan.borrowers?.[0]?.fullName ||
    [loan.borrowers?.[0]?.firstName, loan.borrowers?.[0]?.lastName].filter(Boolean).join(' ') ||
    'Borrower';

  const isPurchase = loan.loanPurpose === 'Purchase';

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'financials' as const, label: 'Financials' },
    { key: 'conditions' as const, label: 'Conditions' },
    { key: 'details' as const, label: 'Details' },
    ...(isPurchase ? [{ key: 'preapproval' as const, label: 'Pre-Approval' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 hidden sm:block">Loan Command Center</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-gray-700 hidden sm:block">{borrowerName}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Welcome, {borrowerName.split(' ')[0]}
          </h2>
          <p className="text-gray-500 text-sm">
            Here is your loan information and status updates.
          </p>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <LoanOverview loan={loan} />
            <LoanTimeline loan={loan} />

            <div className="grid lg:grid-cols-3 gap-6">
              <MonthlyPayment loan={loan} />
              <RateDetails loan={loan} />
              <LoanOfficerCard loan={loan} />
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            <FinancialSummary loan={loan} />
            <div className="grid lg:grid-cols-2 gap-6">
              <CashToClose loan={loan} />
              <KeyDates loan={loan} />
            </div>
          </div>
        )}

        {activeTab === 'conditions' && (
          <LoanConditions loan={loan} />
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <PropertyDetails loan={loan} />
              <BorrowerInfo loan={loan} />
            </div>
          </div>
        )}

        {activeTab === 'preapproval' && isPurchase && (
          <PreApprovalSection loan={loan} />
        )}
      </div>
    </div>
  );
}

function SupabaseDashboard() {
  const { profile, signOut } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;
      setLoans(loansData || []);

      if (loansData && loansData.length > 0) {
        const loanIds = loansData.map((loan) => loan.id);
        const { data: conditionsData, error: conditionsError } = await supabase
          .from('conditions')
          .select('*')
          .in('loan_id', loanIds)
          .eq('responsible_party', 'Borrower')
          .eq('status', 'Open')
          .order('due_date', { ascending: true });

        if (conditionsError) throw conditionsError;
        setConditions(conditionsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">Loan Command Center</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {profile?.first_name} {profile?.last_name}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name}!
          </h2>
          <p className="text-gray-600">Here's an overview of your loan applications</p>
        </div>

        {loans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600 mb-6">You don't have any loan applications yet.</p>
            <a
              href="/apply-new"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Start New Application
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {conditions.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                      Action Required
                    </h3>
                    <p className="text-amber-800 mb-4">
                      You have {conditions.length} open condition{conditions.length !== 1 ? 's' : ''}{' '}
                      that need your attention
                    </p>
                    <div className="space-y-2">
                      {conditions.slice(0, 3).map((condition) => (
                        <div
                          key={condition.id}
                          className="bg-white rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{condition.title}</p>
                            {condition.due_date && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(condition.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <a
                            href={`/loan/${condition.loan_id}/conditions`}
                            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 flex justify-end">
              <a
                href="/apply-new"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Application
              </a>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {loans.map((loan) => {
                const loanConditions = conditions.filter((c) => c.loan_id === loan.id);
                const isInProgress = loan.status === 'In Progress' && !loan.is_submitted;
                return (
                  <div
                    key={loan.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {loan.loan_type || 'Home Loan'}
                          </h3>
                          {loan.property_address && (
                            <p className="text-gray-600 text-sm">{loan.property_address}</p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            loan.status === 'Submitted'
                              ? 'bg-red-100 text-red-800'
                              : loan.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : loan.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : loan.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>

                      {loan.loan_amount && (
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <span className="text-2xl font-bold text-gray-900">
                            ${loan.loan_amount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {isInProgress && loan.application_progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Application Progress</span>
                            <span className="font-medium text-gray-900">{Math.round((loan.application_progress / 7) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-600 rounded-full transition-all"
                              style={{ width: `${(loan.application_progress / 7) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {loanConditions.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 text-amber-700 bg-amber-50 rounded-lg p-3">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {loanConditions.length} open condition
                            {loanConditions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        {isInProgress ? (
                          <a
                            href={`/loan/${loan.id}/apply`}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center flex items-center justify-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Continue Application
                          </a>
                        ) : (
                          <>
                            <a
                              href={`/loan/${loan.id}`}
                              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
                            >
                              View Details
                            </a>
                            <a
                              href={`/loan/${loan.id}/conditions`}
                              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
                            >
                              Conditions
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { session: borrowerSession } = useBorrowerSession();

  if (borrowerSession) {
    return <VestaDashboard />;
  }

  if (user) {
    return <SupabaseDashboard />;
  }

  return null;
}

export default function BorrowerDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loan, Condition, Document } from '../types';
import {
  ArrowLeft,
  Home,
  DollarSign,
  MapPin,
  Calendar,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from './ProtectedRoute';

interface LoanDetailContentProps {
  loanId: string;
}

function LoanDetailContent({ loanId }: LoanDetailContentProps) {
  const { profile } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLoanData();
  }, [loanId]);

  async function loadLoanData() {
    try {
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .maybeSingle();

      if (loanError) throw loanError;
      if (!loanData) {
        setError('Loan not found');
        setLoading(false);
        return;
      }

      setLoan(loanData);

      const [conditionsResult, documentsResult] = await Promise.all([
        supabase
          .from('conditions')
          .select('*')
          .eq('loan_id', loanId)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('loan_id', loanId)
          .order('created_at', { ascending: false }),
      ]);

      if (conditionsResult.error) throw conditionsResult.error;
      if (documentsResult.error) throw documentsResult.error;

      setConditions(conditionsResult.data || []);
      setDocuments(documentsResult.data || []);
    } catch (error: any) {
      console.error('Error loading loan:', error);
      setError(error.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
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

  if (error || !loan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Loan not found'}</p>
            <a
              href="/dashboard"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const openConditions = conditions.filter(
    (c) => c.status === 'Open' && c.responsible_party === 'Borrower'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </a>
              <Home className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">Loan Details</h1>
            </div>
            <span className="text-gray-700">
              {profile?.first_name} {profile?.last_name}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {loan.loan_type || 'Home Loan'}
              </h2>
              {loan.vesta_loan_id && (
                <p className="text-gray-600">Loan ID: {loan.vesta_loan_id}</p>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                loan.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : loan.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {loan.status}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {loan.loan_amount && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${loan.loan_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {loan.property_address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Property Address</p>
                  <p className="text-lg font-semibold text-gray-900">{loan.property_address}</p>
                </div>
              </div>
            )}

            {loan.created_at && (
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Application Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {openConditions.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">
                {openConditions.length} open condition{openConditions.length !== 1 ? 's' : ''}{' '}
                requiring your attention
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <a
              href={`/loan/${loan.id}/conditions`}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              View Conditions
            </a>
          </div>
        </div>

        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              Uploaded Documents
            </h3>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.file_name}</p>
                      <p className="text-sm text-gray-600">
                        Uploaded {new Date(doc.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoanDetailPage({ loanId }: { loanId: string }) {
  return (
    <ProtectedRoute>
      <LoanDetailContent loanId={loanId} />
    </ProtectedRoute>
  );
}

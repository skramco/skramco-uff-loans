import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loan, Condition, Document } from '../types';
import {
  ArrowLeft,
  Home,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Loader,
} from 'lucide-react';
import ProtectedRoute from './ProtectedRoute';

interface LoanConditionsContentProps {
  loanId: string;
}

function LoanConditionsContent({ loanId }: LoanConditionsContentProps) {
  const { user, profile } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [documents, setDocuments] = useState<{ [conditionId: string]: Document[] }>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [loanId]);

  async function loadData() {
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

      const { data: conditionsData, error: conditionsError } = await supabase
        .from('conditions')
        .select('*')
        .eq('loan_id', loanId)
        .order('status', { ascending: true })
        .order('due_date', { ascending: true });

      if (conditionsError) throw conditionsError;
      setConditions(conditionsData || []);

      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      const docsByCondition: { [key: string]: Document[] } = {};
      (documentsData || []).forEach((doc) => {
        if (doc.condition_id) {
          if (!docsByCondition[doc.condition_id]) {
            docsByCondition[doc.condition_id] = [];
          }
          docsByCondition[doc.condition_id].push(doc);
        }
      });
      setDocuments(docsByCondition);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load conditions');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(conditionId: string, file: File) {
    if (!user) return;

    setUploadError('');
    setUploading(conditionId);

    try {
      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size must be less than 25MB');
      }

      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be PDF, PNG, or JPEG');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${loanId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('documents').insert({
        loan_id: loanId,
        condition_id: conditionId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      const { error: updateError } = await supabase
        .from('conditions')
        .update({ status: 'Submitted' })
        .eq('id', conditionId);

      if (updateError) throw updateError;

      await loadData();
      setSelectedCondition(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  }

  function openUploadModal(conditionId: string) {
    setSelectedCondition(conditionId);
    setUploadError('');
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

  const borrowerConditions = conditions.filter((c) => c.responsible_party === 'Borrower');
  const lenderConditions = conditions.filter((c) => c.responsible_party === 'Lender');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <a href={`/loan/${loanId}`} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </a>
              <Home className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">Loan Conditions</h1>
            </div>
            <span className="text-gray-700">
              {profile?.first_name} {profile?.last_name}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Conditions</h2>
          <p className="text-gray-600">{loan.loan_type || 'Home Loan'}</p>
        </div>

        {borrowerConditions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Action Required</h3>
            <div className="space-y-4">
              {borrowerConditions.map((condition) => {
                const conditionDocs = documents[condition.id] || [];
                const statusConfig = {
                  Open: {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'text-amber-800',
                    icon: Clock,
                    iconColor: 'text-amber-600',
                  },
                  Submitted: {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: FileText,
                    iconColor: 'text-red-600',
                  },
                  Cleared: {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: CheckCircle,
                    iconColor: 'text-green-600',
                  },
                };

                const config = statusConfig[condition.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={condition.id}
                    className={`${config.bg} ${config.border} border rounded-xl p-6`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <StatusIcon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">
                            {condition.title}
                          </h4>
                          {condition.description && (
                            <p className="text-gray-700 mb-3">{condition.description}</p>
                          )}
                          {condition.due_date && condition.status === 'Open' && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(condition.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.text} ${config.bg}`}
                      >
                        {condition.status}
                      </span>
                    </div>

                    {conditionDocs.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
                        <div className="space-y-2">
                          {conditionDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg p-2"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="flex-1">{doc.file_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(doc.created_at!).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {condition.status === 'Open' && (
                      <button
                        onClick={() => openUploadModal(condition.id)}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lenderConditions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Lender Processing</h3>
            <div className="space-y-4">
              {lenderConditions.map((condition) => {
                const statusConfig = {
                  Open: {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                  },
                  Submitted: {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                  },
                  Cleared: {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                  },
                };

                const config = statusConfig[condition.status];

                return (
                  <div
                    key={condition.id}
                    className={`${config.bg} ${config.border} border rounded-xl p-6`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{condition.title}</h4>
                        {condition.description && (
                          <p className="text-gray-700">{condition.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.text} ${config.bg}`}
                      >
                        {condition.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {conditions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conditions</h3>
            <p className="text-gray-600">There are no conditions for this loan.</p>
          </div>
        )}
      </div>

      {selectedCondition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              <button
                onClick={() => {
                  setSelectedCondition(null);
                  setUploadError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{uploadError}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Accepted file types: PDF, PNG, JPEG</p>
              <p className="text-sm text-gray-600">Maximum file size: 25MB</p>
            </div>

            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(selectedCondition, file);
                }
              }}
              disabled={uploading === selectedCondition}
              className="w-full"
            />

            {uploading === selectedCondition && (
              <div className="mt-4 flex items-center gap-3 text-red-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoanConditionsPage({ loanId }: { loanId: string }) {
  return (
    <ProtectedRoute>
      <LoanConditionsContent loanId={loanId} />
    </ProtectedRoute>
  );
}

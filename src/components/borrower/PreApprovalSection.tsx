import { useState, useCallback } from 'react';
import {
  Shield,
  Download,
  Mail,
  Eye,
  X,
  Send,
  Printer,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import PreApprovalLetter, { buildPrintHtml } from './PreApprovalLetter';
import { formatCurrency } from './formatters';

interface PreApprovalSectionProps {
  loan: any;
}

export default function PreApprovalSection({ loan }: PreApprovalSectionProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const loanAmount = loan.loanAmount;
  const purchasePrice = loan.salesContractPurchasePrice || loan.subjectProperty?.actualValueAmount;
  const borrowerName =
    loan.primaryBorrowerFullName ||
    loan.borrowers?.[0]?.fullName ||
    [loan.borrowers?.[0]?.firstName, loan.borrowers?.[0]?.lastName].filter(Boolean).join(' ') ||
    'Borrower';

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pre-Approval Letter</h3>
              <p className="text-emerald-100 text-sm">Ready to submit with your offer</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">
                Pre-Approved For
              </p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(loanAmount)}</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">
                Max Purchase Price
              </p>
              <p className="text-xl font-bold text-teal-900">{formatCurrency(purchasePrice)}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Borrower</span>
            </div>
            <p className="text-sm text-slate-900 font-semibold">{borrowerName}</p>
            {loan.borrowers?.[1] && (
              <p className="text-sm text-slate-600 mt-0.5">
                & {loan.borrowers[1].fullName || [loan.borrowers[1].firstName, loan.borrowers[1].lastName].filter(Boolean).join(' ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handlePrint(loan)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewModal loan={loan} onClose={() => setShowPreview(false)} />
      )}

      {showEmailModal && (
        <EmailModal loan={loan} onClose={() => setShowEmailModal(false)} />
      )}
    </>
  );
}

function handlePrint(loan: any) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(buildPrintHtml(loan));
  printWindow.document.close();
  printWindow.focus();
}

function PreviewModal({ loan, onClose }: { loan: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pre-Approval Letter Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint(loan)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[80vh] bg-gray-100 p-4 sm:p-8">
          <div className="shadow-lg rounded-lg overflow-hidden">
            <PreApprovalLetter loan={loan} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ loan, onClose }: { loan: any; onClose: () => void }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const borrowerEmail = loan.borrowers?.[0]?.emailAddress || '';

  const handleSend = useCallback(async () => {
    const emailToSend = recipientEmail.trim() || borrowerEmail;
    if (!emailToSend) {
      setError('Please enter a recipient email address.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-preapproval-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: emailToSend,
          recipientName: recipientName.trim() || undefined,
          loan,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  }, [recipientEmail, recipientName, borrowerEmail, loan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Email Pre-Approval Letter</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Sent</h4>
              <p className="text-gray-600 text-sm mb-6">
                The pre-approval letter has been sent to{' '}
                <span className="font-medium">{recipientEmail.trim() || borrowerEmail}</span>
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-5">
                Send the pre-approval letter to your realtor, seller's agent, or anyone
                involved in your home purchase.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Recipient Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Jane Smith, Realtor"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setError(''); }}
                    placeholder={borrowerEmail || 'realtor@example.com'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Letter
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, FileText, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ApplicationStatus {
  applicationNumber: string;
  status: string;
  statusUpdatedAt: string;
  submittedAt: string;
  applicantName: string;
  loanAmount: number;
  propertyAddress: string;
  statusNotes: string;
  applicationType: 'simple' | 'urla';
}

export default function ViewApplicationPage() {
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setError('Invalid or missing application token');
        setLoading(false);
        return;
      }

      try {
        const { data: simpleApp, error: simpleError } = await supabase
          .from('mortgage_applications')
          .select('*')
          .eq('view_token', token)
          .maybeSingle();

        if (simpleApp) {
          setApplication({
            applicationNumber: simpleApp.application_number,
            status: simpleApp.status,
            statusUpdatedAt: simpleApp.status_updated_at,
            submittedAt: simpleApp.created_at,
            applicantName: `${simpleApp.first_name} ${simpleApp.last_name}`,
            loanAmount: simpleApp.loan_amount,
            propertyAddress: simpleApp.property_address,
            statusNotes: simpleApp.status_notes || '',
            applicationType: 'simple',
          });
          setLoading(false);
          return;
        }

        const { data: urlaApp, error: urlaError } = await supabase
          .from('urla_applications')
          .select('*')
          .eq('view_token', token)
          .maybeSingle();

        if (urlaApp) {
          setApplication({
            applicationNumber: urlaApp.application_number,
            status: urlaApp.status,
            statusUpdatedAt: urlaApp.status_updated_at,
            submittedAt: urlaApp.submitted_at || urlaApp.created_at,
            applicantName: `${urlaApp.borrower_first_name} ${urlaApp.borrower_last_name}`,
            loanAmount: urlaApp.loan_amount,
            propertyAddress: urlaApp.property_address,
            statusNotes: urlaApp.status_notes || '',
            applicationType: 'urla',
          });
          setLoading(false);
          return;
        }

        setError('Application not found');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application:', err);
        setError('Failed to load application');
        setLoading(false);
      }
    };

    fetchApplication();
  }, []);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string; description: string }> = {
      submitted: {
        icon: FileText,
        color: 'text-red-600 bg-red-50 border-red-200',
        label: 'Submitted',
        description: 'Your application has been received and is in our queue for review.',
      },
      under_review: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        label: 'Under Review',
        description: 'Our loan officers are currently reviewing your application.',
      },
      documents_requested: {
        icon: AlertCircle,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        label: 'Documents Requested',
        description: 'We need additional documents to process your application. Please check your email.',
      },
      processing: {
        icon: Loader2,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        label: 'Processing',
        description: 'Your application is being processed. We are working to finalize your loan.',
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50 border-green-200',
        label: 'Approved',
        description: 'Congratulations! Your loan application has been approved.',
      },
      denied: {
        icon: XCircle,
        color: 'text-red-600 bg-red-50 border-red-200',
        label: 'Denied',
        description: 'Unfortunately, we cannot approve your application at this time.',
      },
      closed: {
        icon: CheckCircle,
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        label: 'Closed',
        description: 'This application has been closed.',
      },
    };

    return configs[status] || configs.submitted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Application Status</h1>
            <p className="text-red-100">Track your mortgage application progress</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Application Number</p>
                  <p className="text-2xl font-bold text-gray-900">{application.applicationNumber}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
                  <StatusIcon className="w-5 h-5" />
                  <span className="font-semibold">{statusConfig.label}</span>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${statusConfig.color}`}>
                <p className="text-sm font-medium mb-1">{statusConfig.label}</p>
                <p className="text-sm opacity-90">{statusConfig.description}</p>
                {application.statusNotes && (
                  <p className="text-sm mt-2 font-medium">{application.statusNotes}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-1">Applicant Name</p>
                <p className="text-lg font-semibold text-gray-900">{application.applicantName}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${application.loanAmount.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-1">Property Address</p>
                <p className="text-lg font-semibold text-gray-900">{application.propertyAddress}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-1">Application Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {application.applicationType === 'urla' ? 'Full URLA Application' : 'Simple Application'}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <div className="w-0.5 h-full bg-red-200 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <p className="font-semibold text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(application.submittedAt)}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${application.status !== 'submitted' ? 'bg-red-600' : 'bg-gray-300'}`}></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Status Updated</p>
                    <p className="text-sm text-gray-500">{formatDate(application.statusUpdatedAt)}</p>
                    <p className="text-sm text-gray-600 mt-1">Current status: {statusConfig.label}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your application, please contact us at{' '}
                <a href="mailto:mark@homeloanagents.com" className="text-red-600 hover:underline">
                  mark@homeloanagents.com
                </a>
              </p>
              <p className="text-xs text-gray-500">
                Please reference your application number when contacting us.
              </p>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

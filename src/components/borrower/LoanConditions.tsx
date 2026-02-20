import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  AlertCircle,
  Loader,
  CheckCircle,
  Sparkles,
  X,
  Clock,
  Eye,
} from 'lucide-react';
import { fetchLoanConditions, uploadDocumentToVesta } from '../../services/vestaService';
import ConditionList from './ConditionList';

interface LoanConditionsProps {
  loan: any;
}

interface ConditionItem {
  id: string;
  entityType: string;
  conditionTiming: string | null;
  conditionStatus: string;
  conditionAtFaultUsers: string[];
  instructionsOverride: string;
  conditionCategory?: string;
  objectiveName?: string;
  [key: string]: any;
}

type StatusTab = 'NotReadyToApprove' | 'ReadyToApprove' | 'Approved';

const STATUSES_TO_FETCH: StatusTab[] = ['NotReadyToApprove', 'ReadyToApprove', 'Approved'];

const STATUS_CONFIG: Record<StatusTab, {
  label: string;
  description: string;
  icon: typeof AlertCircle;
  activeClasses: string;
  badgeClasses: string;
  emptyTitle: string;
  emptyDescription: string;
  statusBadgeClasses: string;
  statusBadgeLabel: string;
}> = {
  NotReadyToApprove: {
    label: 'Action Needed',
    description: 'These items need your attention to move your loan forward',
    icon: AlertCircle,
    activeClasses: 'bg-amber-600 text-white shadow-sm',
    badgeClasses: 'bg-amber-100 text-amber-800',
    emptyTitle: 'No Action Needed',
    emptyDescription: 'You have no outstanding items requiring your action right now.',
    statusBadgeClasses: 'bg-amber-50 text-amber-700',
    statusBadgeLabel: 'Action Needed',
  },
  ReadyToApprove: {
    label: 'Under Review',
    description: 'You\'ve submitted these items and they\'re being reviewed by your loan team',
    icon: Clock,
    activeClasses: 'bg-red-600 text-white shadow-sm',
    badgeClasses: 'bg-red-100 text-red-800',
    emptyTitle: 'Nothing Under Review',
    emptyDescription: 'There are no items currently being reviewed by your loan team.',
    statusBadgeClasses: 'bg-red-50 text-red-700',
    statusBadgeLabel: 'Under Review',
  },
  Approved: {
    label: 'Approved',
    description: 'These conditions have been satisfied -- no further action is needed',
    icon: CheckCircle,
    activeClasses: 'bg-green-600 text-white shadow-sm',
    badgeClasses: 'bg-green-100 text-green-800',
    emptyTitle: 'No Approved Conditions Yet',
    emptyDescription: 'Conditions will appear here once they\'ve been reviewed and approved.',
    statusBadgeClasses: 'bg-green-50 text-green-700',
    statusBadgeLabel: 'Approved',
  },
};

function isBorrowerCondition(c: any): boolean {
  return Array.isArray(c.conditionAtFaultUsers)
    ? c.conditionAtFaultUsers.includes('Borrower')
    : c.conditionAtFaultUsers === 'Borrower';
}

export default function LoanConditions({ loan }: LoanConditionsProps) {
  const [allConditions, setAllConditions] = useState<ConditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('NotReadyToApprove');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConditions();
  }, [loan?.id]);

  async function loadConditions() {
    if (!loan?.id) return;
    setLoading(true);
    setError('');

    const result = await fetchLoanConditions(loan.id, STATUSES_TO_FETCH);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const borrowerConditions = (result.conditions || []).filter(isBorrowerCondition);
    setAllConditions(borrowerConditions);
    setLoading(false);
  }

  function getConditionsByStatus(status: StatusTab): ConditionItem[] {
    return allConditions.filter((c) => c.conditionStatus === status);
  }

  function getCountByStatus(status: StatusTab): number {
    return getConditionsByStatus(status).length;
  }

  async function handleFileUpload(file: File) {
    if (!loan?.id) return;

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 25MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('File must be PDF, PNG, or JPEG');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const result = await uploadDocumentToVesta(loan.id, file, 'BorrowerUpload');

    if (result.error) {
      setUploadError(result.error);
    } else {
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(false);
      }, 3000);
    }

    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-8 h-8 text-red-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading conditions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-800 font-medium mb-1">Unable to load conditions</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadConditions}
          className="text-sm font-medium text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const activeConfig = STATUS_CONFIG[activeTab];
  const activeConditions = getConditionsByStatus(activeTab);
  const ActiveIcon = activeConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan Conditions</h3>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of items needed for your loan</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-sky-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-900">AI-Powered Document Processing</p>
          <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
            Upload any document and our AI will automatically identify the document type, categorize it,
            and match it to the appropriate condition listed below. If a match isn't found, it will be
            placed in a general area for your loan officer or underwriter to review -- so your condition
            status may not update immediately.
          </p>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {STATUSES_TO_FETCH.map((status) => {
          const config = STATUS_CONFIG[status];
          const count = getCountByStatus(status);
          const isActive = activeTab === status;
          const Icon = config.icon;

          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? config.activeClasses
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/25 text-white' : config.badgeClasses
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <ActiveIcon className={`w-4.5 h-4.5 ${
              activeTab === 'NotReadyToApprove' ? 'text-amber-600' :
              activeTab === 'ReadyToApprove' ? 'text-red-600' :
              'text-green-600'
            }`} />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{activeConfig.label}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{activeConfig.description}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {activeConditions.length === 0 ? (
            <div className="text-center py-10">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                activeTab === 'NotReadyToApprove' ? 'bg-green-50' :
                activeTab === 'ReadyToApprove' ? 'bg-red-50' :
                'bg-green-50'
              }`}>
                {activeTab === 'NotReadyToApprove' ? (
                  <CheckCircle className="w-7 h-7 text-green-500" />
                ) : activeTab === 'ReadyToApprove' ? (
                  <Eye className="w-7 h-7 text-red-500" />
                ) : (
                  <CheckCircle className="w-7 h-7 text-green-500" />
                )}
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">{activeConfig.emptyTitle}</h4>
              <p className="text-gray-500 text-sm">{activeConfig.emptyDescription}</p>
            </div>
          ) : (
            <ConditionList
              conditions={activeConditions}
              loan={loan}
              statusBadge={
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${activeConfig.statusBadgeClasses}`}>
                  <ActiveIcon className="w-3 h-3" />
                  {activeConfig.statusBadgeLabel}
                </span>
              }
            />
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadError('');
                  setUploadSuccess(false);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Document Uploaded</h4>
                <p className="text-sm text-gray-500">
                  Our AI is processing your document. Your conditions will update once reviewed.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 leading-relaxed">
                    Just upload your document -- our AI will figure out what it is and match it
                    to the right condition automatically.
                  </p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader className="w-8 h-8 text-red-600 animate-spin mb-3" />
                      <p className="text-sm font-medium text-gray-700">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-gray-500">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-3">PDF, PNG, or JPEG up to 25MB</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  disabled={uploading}
                />

                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

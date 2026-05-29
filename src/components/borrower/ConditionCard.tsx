import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  FileCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  createBorrowerLoanNote,
  uploadDocumentToVesta,
} from '../../services/vestaService';
import {
  getConditionDisplayText,
  getConditionTitle,
  getObjectiveConditionId,
  getObjectiveTaskId,
  getRequiredDocumentTypes,
  isDocumentRequiredCondition,
  isSimpleCondition,
  type VestaObjectiveCondition,
} from '../../lib/vestaConditions';

interface ConditionCardProps {
  condition: VestaObjectiveCondition;
  loan: Record<string, unknown>;
  statusBadge: React.ReactNode;
  allowActions: boolean;
  onUpdated?: () => void;
  onAskQuestion?: (condition: VestaObjectiveCondition) => void;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export default function ConditionCard({
  condition,
  loan,
  statusBadge,
  allowActions,
  onUpdated,
  onAskQuestion,
}: ConditionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loanId = String(loan.id || loan.loanId || '');
  const isDocument = isDocumentRequiredCondition(condition);
  const isSimple = isSimpleCondition(condition);
  const displayText = getConditionDisplayText(condition);
  const title = getConditionTitle(condition);
  const requiredTypes = getRequiredDocumentTypes(condition);
  const uploadedCount = condition.associatedDocumentIds?.length ?? 0;
  const objectiveTaskId = getObjectiveTaskId(condition);
  const primaryBorrowerId = Array.isArray(loan.borrowers)
    ? String((loan.borrowers[0] as Record<string, unknown>)?.id || "")
    : "";
  const documentRequiredTaskIds =
    isDocument && condition.taskType === 'DocumentRequired' && objectiveTaskId
      ? [objectiveTaskId]
      : undefined;

  async function handleUpload(file: File) {
    if (!loanId) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('File must be 25MB or smaller.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('File must be PDF, PNG, or JPEG.');
      return;
    }

    setUploading(true);
    const result = await uploadDocumentToVesta(loanId, file, {
      documentTypeId: selectedDocTypeId || requiredTypes[0]?.id,
      documentRequiredTaskIds,
      objectiveConditionId: getObjectiveConditionId(condition),
      objectiveTaskId,
      conditionLabel: title,
      note: note.trim() || undefined,
      borrowerId: primaryBorrowerId || undefined,
    });

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg('Document uploaded. Your loan team will review it shortly.');
      setNote('');
      onUpdated?.();
    }
    setUploading(false);
  }

  async function handleSubmitNote() {
    if (!loanId || !note.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSubmittingNote(true);

    const result = await createBorrowerLoanNote(loanId, note.trim(), {
      objectiveConditionId: getObjectiveConditionId(condition),
      objectiveTaskId: getObjectiveTaskId(condition),
      conditionLabel: title,
    });

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg('Your note was added to the loan file.');
      setNote('');
      onUpdated?.();
    }
    setSubmittingNote(false);
  }

  return (
    <div className="px-4 py-4 bg-white hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-b-0">
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isDocument ? 'bg-sky-100' : 'bg-violet-100'
          }`}
        >
          {isDocument ? (
            <FileCheck className="w-4 h-4 text-sky-700" />
          ) : (
            <FileText className="w-4 h-4 text-violet-700" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {isDocument ? 'Document required' : isSimple ? 'Condition' : 'Task'}
              </p>
              {condition.objectiveName && (
                <p className="text-sm font-medium text-gray-900 mt-0.5">{condition.objectiveName}</p>
              )}
            </div>
            {statusBadge}
          </div>

          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{displayText}</p>

          {isDocument && requiredTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {requiredTypes.map((dt) => (
                <span
                  key={dt.id || dt.name}
                  className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-800 border border-sky-100"
                >
                  {dt.name || 'Required document'}
                </span>
              ))}
            </div>
          )}

          {isDocument && uploadedCount > 0 && (
            <p className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {uploadedCount} document{uploadedCount === 1 ? '' : 's'} on file for this condition
            </p>
          )}

          {allowActions && isDocument && (
            <div className="mt-3 space-y-3 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
              {requiredTypes.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Document type
                  </label>
                  <select
                    value={selectedDocTypeId || requiredTypes[0]?.id || ''}
                    onChange={(e) => setSelectedDocTypeId(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-2 bg-white"
                  >
                    {requiredTypes.map((dt) => (
                      <option key={dt.id || dt.name} value={dt.id || ''}>
                        {dt.name || 'Document'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Note for your loan team (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Add context about this document..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload document
                </button>
              </div>
            </div>
          )}

          {allowActions && isSimple && !isDocument && (
            <div className="mt-3 space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
              <label className="block text-xs font-medium text-gray-600">
                Message for your loan team
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Describe how you've satisfied this condition, or ask a clarifying question..."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none"
              />
              <button
                type="button"
                disabled={!note.trim() || submittingNote}
                onClick={handleSubmitNote}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {submittingNote ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit note to loan file
              </button>
            </div>
          )}

          {successMsg && (
            <p className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-xs text-red-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          {onAskQuestion && (
            <button
              type="button"
              onClick={() => onAskQuestion(condition)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
            >
              <HelpCircle className="w-3 h-3" />
              Email my loan officer instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

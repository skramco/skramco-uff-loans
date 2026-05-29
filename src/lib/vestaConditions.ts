/** Helpers for Vesta objective-conditions (OpenAPI ObjectiveCondition). */

export interface VestaObjectiveCondition {
  id: string;
  conditionId?: string | null;
  objectiveTaskId?: string | null;
  taskType?: string;
  conditionStatus?: string;
  conditionTiming?: string | null;
  conditionCategory?: string;
  objectiveName?: string;
  instructionsOverride?: string | null;
  externalFacingMessage?: string | null;
  internalInstructions?: string | null;
  documentConditions?: Array<{
    requiredDocumentTypes?: Array<{ id?: string; name?: string; externalIdentifier?: string }>;
    numberOfRequiredDocumentTypes?: number;
  }>;
  associatedDocumentIds?: string[] | null;
  [key: string]: unknown;
}

export const BORROWER_NOTE_PREFIX = '[Borrower Portal]';

export function formatBorrowerNoteMessage(
  note: string,
  context?: { conditionLabel?: string; fileName?: string }
): string {
  const lines = [BORROWER_NOTE_PREFIX];
  if (context?.conditionLabel) {
    lines.push(`Condition: ${context.conditionLabel}`);
  }
  if (context?.fileName) {
    lines.push(`Document: ${context.fileName}`);
  }
  lines.push('', note.trim());
  return lines.join('\n');
}

export function isDocumentRequiredCondition(c: VestaObjectiveCondition): boolean {
  if (c.taskType === 'DocumentRequired') return true;
  return Array.isArray(c.documentConditions) && c.documentConditions.length > 0;
}

export function isSimpleCondition(c: VestaObjectiveCondition): boolean {
  if (c.taskType === 'SimpleCondition') return true;
  return Boolean(c.instructionsOverride) && !isDocumentRequiredCondition(c);
}

export function getConditionDisplayText(c: VestaObjectiveCondition): string {
  if (isDocumentRequiredCondition(c)) {
    return (
      c.externalFacingMessage ||
      c.internalInstructions ||
      c.instructionsOverride ||
      'Please upload the requested document(s).'
    );
  }
  return (
    c.instructionsOverride ||
    c.externalFacingMessage ||
    c.internalInstructions ||
    'No instructions provided.'
  );
}

export function getConditionTitle(c: VestaObjectiveCondition): string {
  return c.objectiveName || getConditionDisplayText(c).slice(0, 80);
}

export function getRequiredDocumentTypes(
  c: VestaObjectiveCondition
): Array<{ id?: string; name?: string }> {
  const types: Array<{ id?: string; name?: string }> = [];
  for (const block of c.documentConditions || []) {
    for (const dt of block.requiredDocumentTypes || []) {
      if (dt?.id || dt?.name) types.push({ id: dt.id, name: dt.name });
    }
  }
  return types;
}

export function getObjectiveConditionId(c: VestaObjectiveCondition): string | undefined {
  return (c.conditionId as string) || undefined;
}

export function getObjectiveTaskId(c: VestaObjectiveCondition): string {
  return (c.objectiveTaskId as string) || c.id;
}

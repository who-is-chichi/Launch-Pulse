const VALID_SEVERITIES = ['High', 'Medium', 'Low'];

export function validateActionBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Request body is required';
  const b = body as Record<string, unknown>;
  if (!b.title || typeof b.title !== 'string') return 'title is required';
  if (!b.linkedInsight || typeof b.linkedInsight !== 'string') return 'linkedInsight is required';
  if (!b.owner || typeof b.owner !== 'string') return 'owner is required';
  if (!b.dueDate) return 'dueDate is required';
  if (!b.severity || !VALID_SEVERITIES.includes(b.severity as string)) return 'severity must be High, Medium, or Low';
  return null;
}

const VALID_STATUSES = ['new', 'inprogress', 'blocked', 'done'];
const VALID_OUTCOMES = ['Yes', 'Partial', 'No'];

export function validateImpactScoreBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'impactScore body is required';
  const b = body as Record<string, unknown>;
  const { metric, before, after, change, outcome, completedDate } = b;
  if (!metric || !before || !after || !change || !outcome || !completedDate) {
    return 'impactScore requires metric, before, after, change, outcome, completedDate';
  }
  if (!VALID_OUTCOMES.includes(outcome as string)) return 'outcome must be Yes, Partial, or No';
  return null;
}

export function validateActionPatchBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Request body is required';
  const b = body as Record<string, unknown>;
  if (b.status !== undefined && !VALID_STATUSES.includes(b.status as string)) return 'Invalid status';
  if (b.impactScore !== undefined) {
    return validateImpactScoreBody(b.impactScore);
  }
  return null;
}

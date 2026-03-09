import { describe, it, expect } from 'vitest';
import { validateActionBody, validateImpactScoreBody, validateActionPatchBody } from '../lib/actions-validation';

describe('validateActionBody', () => {
  const valid = {
    title: 'Increase rep call frequency',
    linkedInsight: 'NRx decline in T12',
    owner: 'Jane Smith',
    dueDate: '2026-04-01',
    severity: 'High',
  };

  it('returns null for valid body', () => {
    expect(validateActionBody(valid)).toBeNull();
  });

  it('returns error when title is missing', () => {
    const { title: _, ...body } = valid;
    expect(validateActionBody(body)).toBe('title is required');
  });

  it('returns error when linkedInsight is missing', () => {
    const { linkedInsight: _, ...body } = valid;
    expect(validateActionBody(body)).toBe('linkedInsight is required');
  });

  it('returns error when owner is missing', () => {
    const { owner: _, ...body } = valid;
    expect(validateActionBody(body)).toBe('owner is required');
  });

  it('returns error when dueDate is missing', () => {
    const { dueDate: _, ...body } = valid;
    expect(validateActionBody(body)).toBe('dueDate is required');
  });

  it('returns error for invalid severity', () => {
    expect(validateActionBody({ ...valid, severity: 'Critical' })).toBe('severity must be High, Medium, or Low');
  });

  it('returns error for missing severity', () => {
    const { severity: _, ...body } = valid;
    expect(validateActionBody(body)).toBe('severity must be High, Medium, or Low');
  });
});

describe('validateImpactScoreBody', () => {
  const valid = {
    metric: 'NRx Count',
    before: '100.0',
    after: '112.0',
    change: '+12.0%',
    outcome: 'Yes',
    completedDate: '2026-03-01',
  };

  it('returns null for valid impactScore body', () => {
    expect(validateImpactScoreBody(valid)).toBeNull();
  });

  it('returns error when a field is missing', () => {
    const { metric: _, ...body } = valid;
    expect(validateImpactScoreBody(body)).toContain('requires metric');
  });

  it('returns error for invalid outcome', () => {
    expect(validateImpactScoreBody({ ...valid, outcome: 'Maybe' })).toBe('outcome must be Yes, Partial, or No');
  });
});

describe('validateActionPatchBody', () => {
  it('returns null for valid status', () => {
    expect(validateActionPatchBody({ status: 'done' })).toBeNull();
  });

  it('returns error for invalid status', () => {
    expect(validateActionPatchBody({ status: 'cancelled' })).toBe('Invalid status');
  });

  it('returns null when no fields provided', () => {
    expect(validateActionPatchBody({})).toBeNull();
  });
});

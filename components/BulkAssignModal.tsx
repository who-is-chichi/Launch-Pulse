'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Insight {
  id: string;
  headline: string;
  severity: string;
}

interface BulkAssignModalProps {
  open: boolean;
  onClose: () => void;
  insights: Insight[];
  brandCode: string;
  onSuccess?: () => void;
}

const DEFAULT_FORM = {
  owner: '',
  dueDate: '',
  expectedLag: '',
};

export default function BulkAssignModal({
  open,
  onClose,
  insights,
  brandCode,
  onSuccess,
}: BulkAssignModalProps) {
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM });
      setError(null);
      setProgress(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setProgress({ current: 0, total: insights.length });

    let successCount = 0;
    let firstError: string | null = null;

    for (let i = 0; i < insights.length; i++) {
      const insight = insights[i];
      setProgress({ current: i + 1, total: insights.length });
      try {
        const res = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Action: ${insight.headline.slice(0, 80)}`,
            owner: form.owner,
            dueDate: form.dueDate,
            expectedLag: form.expectedLag,
            severity: insight.severity,
            linkedInsight: insight.headline,
            insightId: insight.id,
            brandCode,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        successCount++;
      } catch (err) {
        if (!firstError) {
          firstError = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }

    setSubmitting(false);
    setProgress(null);

    if (successCount > 0) {
      toast.success(`${successCount} action${successCount !== 1 ? 's' : ''} created successfully`);
      onSuccess?.();
      onClose();
    } else {
      const msg = firstError ?? 'Failed to create actions. Please try again.';
      setError(msg);
      toast.error(msg);
    }
  };

  if (!open) return null;

  const shownInsights = insights.slice(0, 5);
  const remaining = insights.length - shownInsights.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-assign-title"
        className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 w-full max-w-md mx-4"
        style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.15)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="bulk-assign-title" className="text-base font-semibold text-[#0F172A]">
            Bulk Assign Actions
          </h3>
          <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
            Selected Insights ({insights.length})
          </p>
          <ul className="space-y-1">
            {shownInsights.map((insight) => (
              <li key={insight.id} className="text-xs text-[#334155] truncate">
                {insight.headline}
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-xs text-[#94A3B8]">+ {remaining} more</li>
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
              Owner
            </label>
            <input
              required
              type="text"
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
              placeholder="Name or team"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                Due Date
              </label>
              <input
                required
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                Expected Lag
              </label>
              <select
                value={form.expectedLag}
                onChange={e => setForm(f => ({ ...f, expectedLag: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
              >
                <option value="">Select...</option>
                <option value="Immediate">Immediate</option>
                <option value="1-2 weeks">1–2 weeks</option>
                <option value="2-3 weeks">2–3 weeks</option>
              </select>
            </div>
          </div>

          {progress && (
            <div className="text-[12px] text-[#1D4ED8] text-center bg-[#EFF6FF] rounded-xl px-3 py-2 border border-[#BFDBFE]">
              Creating {progress.current} of {progress.total} actions...
            </div>
          )}

          {error && (
            <p className="text-[12px] text-[#DC2626] text-center">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { onClose(); setError(null); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting || insights.length === 0}>
              {submitting ? `Creating...` : `Assign ${insights.length} Action${insights.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

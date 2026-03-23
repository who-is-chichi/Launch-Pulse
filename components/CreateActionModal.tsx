'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CreateActionModalProps {
  open: boolean;
  onClose: () => void;
  brandCode: string;
  prefill?: {
    title?: string;
    severity?: 'High' | 'Medium' | 'Low';
    notes?: string;
    linkedInsight?: string;
    insightId?: string;
  };
  onSuccess?: () => void;
}

const DEFAULT_FORM = {
  title: '',
  owner: '',
  ownerRole: '',
  dueDate: '',
  severity: 'Medium',
  expectedLag: '',
  notes: '',
};

export default function CreateActionModal({
  open,
  onClose,
  brandCode,
  prefill,
  onSuccess,
}: CreateActionModalProps) {
  const [actionForm, setActionForm] = useState({ ...DEFAULT_FORM });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActionForm({
        ...DEFAULT_FORM,
        title: prefill?.title ?? '',
        severity: prefill?.severity ?? 'Medium',
        notes: prefill?.notes ?? '',
      });
      setActionSuccess(false);
      setActionError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...actionForm,
          brandCode,
          insightId: prefill?.insightId,
          linkedInsight: prefill?.linkedInsight,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setActionSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setActionSuccess(false);
        setActionForm({ ...DEFAULT_FORM });
      }, 1200);
    } catch {
      setActionError('Failed to create action. Please try again.');
      toast.error('Failed to create action. Please try again.');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-action-title"
        className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 w-full max-w-md mx-4"
        style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.15)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="create-action-title" className="text-base font-semibold text-[#0F172A]">Create Action Item</h3>
          <button onClick={onClose} className="text-[#CBD5E1] hover:text-[#64748B] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {actionSuccess ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">✓</div>
            <p className="text-sm font-medium text-[#16A34A]">Action item created</p>
          </div>
        ) : (
          <form onSubmit={handleActionSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Title</label>
              <input
                required
                type="text"
                value={actionForm.title}
                onChange={e => setActionForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What needs to happen?"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Owner</label>
                <input
                  required
                  type="text"
                  value={actionForm.owner}
                  onChange={e => setActionForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="Name or team"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Due Date</label>
                <input
                  required
                  type="date"
                  value={actionForm.dueDate}
                  onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Severity</label>
                <select
                  value={actionForm.severity}
                  onChange={e => setActionForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Expected Lag</label>
                <select
                  value={actionForm.expectedLag}
                  onChange={e => setActionForm(f => ({ ...f, expectedLag: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="Immediate">Immediate</option>
                  <option value="1-2 weeks">1–2 weeks</option>
                  <option value="2-3 weeks">2–3 weeks</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Owner Role <span className="font-normal text-[#94A3B8]">(optional)</span></label>
              <input
                type="text"
                value={actionForm.ownerRole}
                onChange={e => setActionForm(f => ({ ...f, ownerRole: e.target.value }))}
                placeholder="e.g. Regional Sales Director"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Notes <span className="font-normal text-[#94A3B8]">(optional)</span></label>
              <textarea
                value={actionForm.notes}
                onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional context or instructions..."
                rows={2}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors resize-none"
              />
            </div>
            {prefill?.linkedInsight && (
              <div className="text-[11px] text-[#94A3B8] bg-[#F8FAFC] rounded-xl px-3 py-2 border border-[#E2E8F0]">
                Linked to: <span className="text-[#334155] font-medium">{prefill.linkedInsight}</span>
              </div>
            )}
            {actionError && (
              <p className="text-[12px] text-[#DC2626] text-center">{actionError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { onClose(); setActionError(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={actionSubmitting}>
                {actionSubmitting ? 'Creating...' : 'Create Action'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

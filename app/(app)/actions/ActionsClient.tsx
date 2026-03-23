'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, User, Calendar, Target, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeverityBadge from '@/components/SeverityBadge';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/components/FilterContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface ImpactScore {
  metric: string;
  before: string;
  after: string;
  change: string;
  outcome: string;
  completedDate: Date | string;
  autoEvaluated?: boolean;
}

interface Action {
  id: string;
  title: string;
  linkedInsight: string;
  owner: string;
  ownerRole?: string | null;
  dueDate: Date | string;
  severity: string;
  expectedLag: string;
  status: string;
  notes?: string | null;
  impactScore: ImpactScore | null;
}

const columnConfig = [
  { key: 'new', label: 'New', color: '#64748B', bg: 'bg-[#F8FAFC]', headerBg: 'bg-[#F1F5F9]' },
  { key: 'inprogress', label: 'In Progress', color: '#1D4ED8', bg: 'bg-[#EFF6FF]/30', headerBg: 'bg-[#EFF6FF]' },
  { key: 'blocked', label: 'Blocked', color: '#D97706', bg: 'bg-[#FFFBEB]/30', headerBg: 'bg-[#FFFBEB]' },
  { key: 'done', label: 'Done', color: '#16A34A', bg: 'bg-[#F0FDF4]/30', headerBg: 'bg-[#F0FDF4]' },
];

const ITEM_TYPE = 'ACTION_CARD';

const COLUMN_LABELS: Record<string, string> = {
  new: 'New',
  inprogress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

function ActionCard({ action, onMove }: { action: Action; onMove: (id: string, status: string) => void }) {
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: action.id, fromStatus: action.status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const otherStatuses = Object.keys(COLUMN_LABELS).filter((s) => s !== action.status);

  return (
    <div
      ref={dragRef as unknown as React.RefObject<HTMLDivElement>}
      className="group bg-white border border-[#E2E8F0] rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing select-none"
      style={{ boxShadow: 'var(--card-shadow)', opacity: isDragging ? 0.4 : 1 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)'; }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-[#0F172A] flex-1 pr-2">{action.title}</h4>
        <SeverityBadge severity={action.severity as 'High' | 'Medium' | 'Low'} />
      </div>

      <div className="text-[11px] text-[#94A3B8] mb-3 bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#F1F5F9] font-medium">
        {action.linkedInsight}
      </div>

      <div className="space-y-1.5 text-[11px] text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          <span className="font-medium text-[#334155]">{action.owner}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-medium text-[#334155]">{formatDate(action.dueDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#D97706]">{action.expectedLag}</span>
        </div>
      </div>

      {/* Pick-and-transfer: move buttons shown on hover */}
      <div className="hidden group-hover:flex gap-1 pt-2 mt-2 border-t border-[#F1F5F9] flex-wrap">
        {otherStatuses.map((s) => (
          <button
            key={s}
            onClick={(e) => { e.stopPropagation(); onMove(action.id, s); }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] font-medium transition-colors cursor-pointer"
          >
            → {COLUMN_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  cards,
  onMove,
}: {
  col: typeof columnConfig[number];
  cards: Action[];
  onMove: (id: string, status: string) => void;
}) {
  const [{ isOver }, dropRef] = useDrop<{ id: string; fromStatus: string }, void, { isOver: boolean }>(() => ({
    accept: ITEM_TYPE,
    drop: (item) => {
      if (item.fromStatus !== col.key) {
        onMove(item.id, col.key);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div key={col.key}>
      <div className={`${col.headerBg} px-4 py-3 rounded-t-xl border-t-2`} style={{ borderTopColor: col.color }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F172A]">{col.label}</h3>
          <Badge className="rounded-full border bg-white text-[#334155] border-[#E2E8F0] text-[11px] font-semibold">
            {cards.length}
          </Badge>
        </div>
      </div>
      <div
        ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
        className={`space-y-3 p-3 ${col.bg} rounded-b-xl min-h-[500px] border border-t-0 transition-colors duration-150 ${
          isOver ? 'ring-2 ring-inset ring-[#1D4ED8]/40 bg-[#EFF6FF]/40' : 'border-[#E2E8F0]'
        }`}
      >
        {cards.map((action) => (
          <ActionCard key={action.id} action={action} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

const today = new Date().toISOString().split('T')[0];

interface ImpactForm {
  metric: string;
  before: string;
  after: string;
  change: string;
  outcome: 'Yes' | 'Partial' | 'No';
  completedDate: string;
}

const defaultImpactForm = (): ImpactForm => ({
  metric: '',
  before: '',
  after: '',
  change: '',
  outcome: 'Yes',
  completedDate: today,
});

export default function ActionsClient({ actions: initialActions }: { actions: Action[] }) {
  const [activeTab, setActiveTab] = useState('board');
  const [actions, setActions] = useState(initialActions);
  const { searchQuery, brand } = useFilters();
  const inFlight = useRef<Set<string>>(new Set());

  // Impact score modal state
  const [impactModal, setImpactModal] = useState<{ id: string } | null>(null);
  const [impactForm, setImpactForm] = useState<ImpactForm>(defaultImpactForm());
  const [impactSubmitting, setImpactSubmitting] = useState(false);

  const [orgUsers, setOrgUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setOrgUsers(data.users ?? []))
      .catch(() => {});
  }, []);

  // Create action manually modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', linkedInsight: '', owner: '', ownerRole: '', dueDate: '', severity: 'Medium', expectedLag: '', notes: '' });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    setManualError(null);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandCode: brand, ...manualForm }),
      });
      if (!res.ok) {
        const data = await res.json();
        setManualError(data.error ?? 'Failed to create action');
        return;
      }
      const { action } = await res.json();
      setActions((prev) => [action, ...prev]);
      setShowManualModal(false);
      setManualForm({ title: '', linkedInsight: '', owner: '', ownerRole: '', dueDate: '', severity: 'Medium', expectedLag: '', notes: '' });
    } catch {
      setManualError('Failed to create action');
    } finally {
      setManualSubmitting(false);
    }
  };

  const commitStatusChange = async (id: string, newStatus: string, impactScore?: ImpactForm) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    const prev = actions;
    setActions((a) => a.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandCode: brand, status: newStatus, ...(impactScore ? { impactScore } : {}) }),
      });
      if (!res.ok) setActions(prev);
    } catch {
      setActions(prev);
    } finally {
      inFlight.current.delete(id);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === 'done') {
      // Show impact modal; commit happens on submit or skip
      setImpactModal({ id });
      setImpactForm(defaultImpactForm());
    } else {
      commitStatusChange(id, newStatus);
    }
  };

  const handleImpactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impactModal) return;
    setImpactSubmitting(true);
    await commitStatusChange(impactModal.id, 'done', impactForm);
    setImpactSubmitting(false);
    setImpactModal(null);
  };

  const handleImpactSkip = () => {
    if (!impactModal) return;
    commitStatusChange(impactModal.id, 'done');
    setImpactModal(null);
  };

  const filteredActions = actions.filter((action) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      action.title.toLowerCase().includes(q) ||
      action.linkedInsight.toLowerCase().includes(q) ||
      action.owner.toLowerCase().includes(q)
    );
  });

  const groupedActions = {
    new: filteredActions.filter((a) => a.status === 'new'),
    inprogress: filteredActions.filter((a) => a.status === 'inprogress'),
    blocked: filteredActions.filter((a) => a.status === 'blocked'),
    done: filteredActions.filter((a) => a.status === 'done'),
  };

  const scorecards = actions.filter((a) => a.status === 'done' && a.impactScore);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-1">Actions & Impact</h1>
          <p className="text-sm text-[#64748B]">Turn insights into ownership and measure outcomes</p>
        </div>
        <Button className="gap-2" onClick={() => setShowManualModal(true)}>
          <Plus className="w-4 h-4" />
          Create Action Manually
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">Action Board</TabsTrigger>
          <TabsTrigger value="impact">Impact Scorecards</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-4 gap-4">
              {columnConfig.map((col) => (
                <KanbanColumn
                  key={col.key}
                  col={col}
                  cards={groupedActions[col.key as keyof typeof groupedActions]}
                  onMove={handleStatusChange}
                />
              ))}
            </div>
          </DndProvider>
        </TabsContent>

        <TabsContent value="impact" className="mt-6">
          <div className="space-y-6">
            {scorecards.length === 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--card-shadow)' }}>
                <p className="text-sm text-[#94A3B8]">No completed actions with impact scores yet.</p>
              </div>
            )}
            {scorecards.map((item, index) => {
              const score = item.impactScore!;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
                  style={{ boxShadow: 'var(--card-shadow)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#0F172A] mb-1">{item.title}</h3>
                      <p className="text-sm text-[#94A3B8]">Completed: {formatDate(score.completedDate)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {score.autoEvaluated && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">Auto</span>
                      )}
                      <Badge className={`rounded-full border font-semibold text-[11px] ${
                        score.outcome === 'Yes' ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' :
                        score.outcome === 'Partial' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                        'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                      }`}>
                        {score.outcome === 'Yes' ? 'Worked as Expected' :
                         score.outcome === 'Partial' ? 'Partial Impact' : 'No Measurable Impact'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                      <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">{score.metric}</div>
                      <div>
                        <div className="text-[10px] text-[#94A3B8] uppercase">Before</div>
                        <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{score.before}</div>
                      </div>
                    </div>
                    <div className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                      <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">&nbsp;</div>
                      <div>
                        <div className="text-[10px] text-[#94A3B8] uppercase">After</div>
                        <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{score.after}</div>
                      </div>
                    </div>
                    <div className="border border-[#BBF7D0] rounded-xl p-4 bg-[#F0FDF4]/50">
                      <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">&nbsp;</div>
                      <div>
                        <div className="text-[10px] text-[#94A3B8] uppercase">Change</div>
                        <div className="text-xl font-semibold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{score.change}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Action Manually Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowManualModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="create-manual-action-title" className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]" style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.15)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 id="create-manual-action-title" className="text-base font-semibold text-[#0F172A]">Create Action Item</h3>
              <button onClick={() => setShowManualModal(false)} className="text-[#CBD5E1] hover:text-[#64748B] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Title <span className="text-red-400">*</span></label>
                <input required type="text" placeholder="e.g. Increase rep coverage in T12" value={manualForm.title} onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Linked Insight <span className="text-red-400">*</span></label>
                <input required type="text" placeholder="e.g. NRx decline in Northeast territory" value={manualForm.linkedInsight} onChange={e => setManualForm(f => ({ ...f, linkedInsight: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Owner <span className="text-red-400">*</span></label>
                  {orgUsers.length > 0 ? (
                    <select required value={manualForm.owner} onChange={e => setManualForm(f => ({ ...f, owner: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors">
                      <option value="">Select owner...</option>
                      {orgUsers.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
                    </select>
                  ) : (
                    <input required type="text" placeholder="e.g. Jane Smith" value={manualForm.owner} onChange={e => setManualForm(f => ({ ...f, owner: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors" />
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Owner Role <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                  <input type="text" placeholder="e.g. Regional Director" value={manualForm.ownerRole} onChange={e => setManualForm(f => ({ ...f, ownerRole: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Due Date <span className="text-red-400">*</span></label>
                  <input required type="date" value={manualForm.dueDate} onChange={e => setManualForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Severity <span className="text-red-400">*</span></label>
                  <select value={manualForm.severity} onChange={e => setManualForm(f => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Expected Lag</label>
                <select value={manualForm.expectedLag} onChange={e => setManualForm(f => ({ ...f, expectedLag: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors">
                  <option value="">Select lag...</option>
                  <option value="Immediate">Immediate</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="2-3 weeks">2-3 weeks</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Notes <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                <textarea rows={2} placeholder="Additional context..." value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors resize-none" />
              </div>
              {manualError && <p className="text-xs text-red-500">{manualError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 text-[#94A3B8]" onClick={() => setShowManualModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={manualSubmitting}>{manualSubmitting ? 'Creating...' : 'Create Action'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impact Score Modal */}
      {impactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleImpactSkip} />
          <div role="dialog" aria-modal="true" aria-labelledby="record-impact-title" className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 w-full max-w-md mx-4" style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.15)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 id="record-impact-title" className="text-base font-semibold text-[#0F172A]">Record Impact</h3>
              <button onClick={handleImpactSkip} className="text-[#CBD5E1] hover:text-[#64748B] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-[#94A3B8] mb-4">Optional — document the measurable outcome of this action.</p>
            <form onSubmit={handleImpactSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Metric</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. NRx Count, SP Resolution Time"
                  value={impactForm.metric}
                  onChange={(e) => setImpactForm((f) => ({ ...f, metric: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Before</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 142"
                    value={impactForm.before}
                    onChange={(e) => setImpactForm((f) => ({ ...f, before: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">After</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 158"
                    value={impactForm.after}
                    onChange={(e) => setImpactForm((f) => ({ ...f, after: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Change</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. +11%"
                    value={impactForm.change}
                    onChange={(e) => setImpactForm((f) => ({ ...f, change: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Outcome</label>
                  <select
                    value={impactForm.outcome}
                    onChange={(e) => setImpactForm((f) => ({ ...f, outcome: e.target.value as 'Yes' | 'Partial' | 'No' }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  >
                    <option value="Yes">Yes — Worked as Expected</option>
                    <option value="Partial">Partial Impact</option>
                    <option value="No">No Measurable Impact</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Completed</label>
                  <input
                    required
                    type="date"
                    value={impactForm.completedDate}
                    onChange={(e) => setImpactForm((f) => ({ ...f, completedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 text-[#94A3B8]" onClick={handleImpactSkip}>
                  Skip for now
                </Button>
                <Button type="submit" className="flex-1" disabled={impactSubmitting}>
                  {impactSubmitting ? 'Saving...' : 'Save Impact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

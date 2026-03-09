import React, { useState } from 'react';
import { Plus, User, Calendar, Target, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import SeverityBadge from '../components/SeverityBadge';
import { Badge } from '../components/ui/badge';
import { useFilters } from '../components/FilterContext';

interface ActionCard {
  id: string;
  title: string;
  linkedInsight: string;
  owner: string;
  dueDate: string;
  severity: 'High' | 'Medium' | 'Low';
  expectedLag: string;
  status: 'new' | 'inprogress' | 'blocked' | 'done';
}

const actions: ActionCard[] = [
  {
    id: '1',
    title: 'Deep-dive SP "Pending Outreach" backlog with hub partner',
    linkedInsight: "SP backlog up 18%",
    owner: 'Sarah Johnson',
    dueDate: 'Mar 8, 2026',
    severity: 'High',
    expectedLag: '1-2 weeks',
    status: 'inprogress',
  },
  {
    id: '2',
    title: 'Review T12 call plans and Account prioritization with RSD',
    linkedInsight: 'Coverage down 20% in T12',
    owner: 'Michael Chen',
    dueDate: 'Mar 10, 2026',
    severity: 'Medium',
    expectedLag: '2-3 weeks',
    status: 'new',
  },
  {
    id: '3',
    title: 'Validate Northeast parent system drops are not data artifacts',
    linkedInsight: 'NRx down 12% WoW in Northeast',
    owner: 'Emily Rodriguez',
    dueDate: 'Mar 6, 2026',
    severity: 'High',
    expectedLag: 'Immediate',
    status: 'inprogress',
  },
  {
    id: '4',
    title: 'Hub partner meeting - waiting on scheduling',
    linkedInsight: 'Dispense lag in Midwest',
    owner: 'David Kim',
    dueDate: 'Mar 7, 2026',
    severity: 'Medium',
    expectedLag: '1 week',
    status: 'blocked',
  },
  {
    id: '5',
    title: 'Implemented improved SP triage process',
    linkedInsight: 'SP resolution time variance',
    owner: 'Sarah Johnson',
    dueDate: 'Feb 28, 2026',
    severity: 'High',
    expectedLag: '2 weeks',
    status: 'done',
  },
];

const impactScores = [
  {
    action: 'Implemented improved SP triage process',
    metric: 'Median SP Resolution Time',
    before: '14.2 days',
    after: '11.8 days',
    change: '-2.4 days',
    outcome: 'Yes',
    completedDate: 'Feb 28, 2026',
  },
  {
    action: 'Updated call targeting for high-value accounts',
    metric: 'HCP Coverage Rate',
    before: '64%',
    after: '71%',
    change: '+7%',
    outcome: 'Partial',
    completedDate: 'Feb 20, 2026',
  },
];

const columnConfig = [
  { key: 'new', label: 'New', color: '#64748B', bg: 'bg-[#F8FAFC]', headerBg: 'bg-[#F1F5F9]' },
  { key: 'inprogress', label: 'In Progress', color: '#1D4ED8', bg: 'bg-[#EFF6FF]/30', headerBg: 'bg-[#EFF6FF]' },
  { key: 'blocked', label: 'Blocked', color: '#D97706', bg: 'bg-[#FFFBEB]/30', headerBg: 'bg-[#FFFBEB]' },
  { key: 'done', label: 'Done', color: '#16A34A', bg: 'bg-[#F0FDF4]/30', headerBg: 'bg-[#F0FDF4]' },
];

function ActionCardComponent({ action }: { action: ActionCard }) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
      style={{ boxShadow: 'var(--card-shadow)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)'; }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-[#0F172A] flex-1 pr-2">{action.title}</h4>
        <SeverityBadge severity={action.severity} />
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
          <span className="font-medium text-[#334155]">{action.dueDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#D97706]">{action.expectedLag}</span>
        </div>
      </div>
    </div>
  );
}

export default function ActionsImpact() {
  const [activeTab, setActiveTab] = useState('board');
  const { searchQuery } = useFilters();

  const filteredActions = actions.filter((action) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return action.title.toLowerCase().includes(q) ||
      action.linkedInsight.toLowerCase().includes(q) ||
      action.owner.toLowerCase().includes(q);
  });

  const groupedActions = {
    new: filteredActions.filter(a => a.status === 'new'),
    inprogress: filteredActions.filter(a => a.status === 'inprogress'),
    blocked: filteredActions.filter(a => a.status === 'blocked'),
    done: filteredActions.filter(a => a.status === 'done'),
  };

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
          <p className="text-sm text-[#64748B]">
            Turn insights into ownership and measure outcomes
          </p>
        </div>
        <Button className="gap-2">
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
          <div className="grid grid-cols-4 gap-4">
            {columnConfig.map((col) => (
              <div key={col.key}>
                <div className={`${col.headerBg} px-4 py-3 rounded-t-xl border-t-2`} style={{ borderTopColor: col.color }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#0F172A]">{col.label}</h3>
                    <Badge className="rounded-full border bg-white text-[#334155] border-[#E2E8F0] text-[11px] font-semibold">
                      {groupedActions[col.key as keyof typeof groupedActions].length}
                    </Badge>
                  </div>
                </div>
                <div className={`space-y-3 p-3 ${col.bg} rounded-b-xl min-h-[500px] border border-t-0 border-[#E2E8F0]`}>
                  {groupedActions[col.key as keyof typeof groupedActions].map(action => (
                    <ActionCardComponent key={action.id} action={action} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="mt-6">
          <div className="space-y-6">
            {impactScores.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
                style={{ boxShadow: 'var(--card-shadow)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#0F172A] mb-1">{item.action}</h3>
                    <p className="text-sm text-[#94A3B8]">Completed: {item.completedDate}</p>
                  </div>
                  <Badge className={`rounded-full border font-semibold text-[11px] ${
                    item.outcome === 'Yes' ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' :
                    item.outcome === 'Partial' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                    'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {item.outcome === 'Yes' ? 'Worked as Expected' :
                     item.outcome === 'Partial' ? 'Partial Impact' :
                     'No Measurable Impact'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                    <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">{item.metric}</div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase">Before</div>
                      <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.before}</div>
                    </div>
                  </div>

                  <div className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                    <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">&nbsp;</div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase">After</div>
                      <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.after}</div>
                    </div>
                  </div>

                  <div className="border border-[#BBF7D0] rounded-xl p-4 bg-[#F0FDF4]/50">
                    <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">&nbsp;</div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase">Change</div>
                      <div className="text-xl font-semibold text-[#16A34A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.change}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
                  <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">Outcome Trend</div>
                  <div className="h-16 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#CBD5E1] text-sm">
                    Before/After Trend Chart
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
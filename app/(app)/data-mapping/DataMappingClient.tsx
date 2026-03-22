'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Clock, Info, Plus, History, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import UploadMappingWizard from './UploadMappingWizard';
import { toast } from 'sonner';

interface Dataset {
  id: string;
  name: string;
  displayName: string;
  lastRun: Date | string;
  freshness: string;
  coverage: number;
  notes: string;
}

interface MappingConfig {
  id: string;
  dataset: string;
  status: string;
  lastUpdated: string;
}

interface NormalizationRule {
  id: string;
  hubValue: string;
  normalizedValue: string;
  category: string;
}

interface PublishedMapping {
  id: string;
  name: string;
  dataset: string;
  publishedBy: string;
  publishedAt: string;
  fieldCount: number;
  status: string;
}

interface DataRun {
  timeWindow: string;
  geography: string;
  runAt: string;
}

interface CrosswalkStat {
  id: string;
  statType: string;
  label: string;
  matchRate: number;
  unmatchedCount: number;
  entityType: string;
}

interface FileManifest {
  id: string;
  sourceFileName: string | null;
  rowCountLoaded: number | null;
  rowCountRejected: number | null;
  status: string | null;
}

interface IngestionRun {
  id: string;
  sourceSystem: string;
  sourceFeedName: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  recordsLoaded: number | null;
  recordsRejected: number | null;
  triggerType: string | null;
  fileManifests: FileManifest[];
}

interface Props {
  datasets: Dataset[];
  mappingConfigs: MappingConfig[];
  normalizationRules: NormalizationRule[];
  publishedMappings: PublishedMapping[];
  dataRun: DataRun | null;
  brandCode: string;
  crosswalkStats: CrosswalkStat[];
  ingestionRuns: IngestionRun[];
}

function getRunStatusColor(status: string) {
  if (status === 'success') return 'bg-emerald-100 text-emerald-800';
  if (status === 'partial_success') return 'bg-amber-100 text-amber-800';
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'running') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function FreshnessIcon({ freshness }: { freshness: string }) {
  if (freshness === 'Fresh') return <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />;
  if (freshness === 'Lag') return <Clock className="w-4 h-4 text-[#D97706]" />;
  return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />;
}

function FreshnessBadge({ freshness }: { freshness: string }) {
  const colors: Record<string, string> = {
    Fresh: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    Lag: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    Stale: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  };
  return (
    <Badge className={`rounded-full border font-semibold text-[11px] ${colors[freshness] ?? ''}`}>
      {freshness}
    </Badge>
  );
}

export default function DataMappingClient({
  datasets,
  mappingConfigs,
  normalizationRules,
  publishedMappings,
  dataRun,
  brandCode,
  crosswalkStats,
  ingestionRuns,
}: Props) {
  const [activeTab, setActiveTab] = useState('status');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MappingConfig | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [configs, setConfigs] = useState<MappingConfig[]>(mappingConfigs);
  const [editingRule, setEditingRule] = useState<NormalizationRule | null>(null);
  const [editNormalizedValue, setEditNormalizedValue] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [rules, setRules] = useState<NormalizationRule[]>(normalizationRules);

  const formatLastRun = (date: Date | string) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

  const openEdit = (config: MappingConfig) => {
    setEditingConfig(config);
    setEditStatus(config.status);
  };

  const saveEdit = async () => {
    if (!editingConfig) return;
    try {
      const res = await fetch('/api/data-mapping/configs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingConfig.id, status: editStatus, brandCode }),
      });
      if (res.ok) {
        const { config } = await res.json();
        setConfigs((prev) =>
          prev.map((c) =>
            c.id === config.id
              ? { ...c, status: config.status, lastUpdated: config.lastUpdated }
              : c
          )
        );
      } else {
        toast.error('Failed to update mapping status');
      }
    } catch {
      toast.error('Failed to update mapping status');
    }
    setEditingConfig(null);
  };

  const openEditRule = (rule: NormalizationRule) => {
    setEditingRule(rule);
    setEditNormalizedValue(rule.normalizedValue);
    setEditCategory(rule.category);
  };

  const saveEditRule = async () => {
    if (!editingRule) return;
    try {
      const res = await fetch('/api/data-mapping/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          normalizedValue: editNormalizedValue,
          category: editCategory,
          brandCode,
        }),
      });
      if (res.ok) {
        const { rule } = await res.json();
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id
              ? { ...r, normalizedValue: rule.normalizedValue, category: rule.category }
              : r
          )
        );
      } else {
        toast.error('Failed to update normalization rule');
      }
    } catch {
      toast.error('Failed to update normalization rule');
    }
    setEditingRule(null);
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
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-1">Data & Mapping</h1>
          {dataRun ? (
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {dataRun.timeWindow} · {dataRun.geography} · {new Date(dataRun.runAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-[#64748B]">Monitor data pipelines and manage configuration</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { setActiveTab('mappings'); setWizardOpen(true); }}
          >
            <Upload className="w-4 h-4" />
            Upload Mapping
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status">Latest Drop Status</TabsTrigger>
          <TabsTrigger value="mappings">Mapping Configurations</TabsTrigger>
          <TabsTrigger value="normalization">Normalization Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
            style={{ boxShadow: 'var(--card-shadow)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Dataset</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Last Run</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Freshness</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Coverage</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {datasets.map((dataset) => (
                    <tr key={dataset.name} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FreshnessIcon freshness={dataset.freshness} />
                          <span className="text-sm font-medium text-[#0F172A]">{dataset.displayName}</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-0.5 ml-6">{dataset.name}</div>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#334155]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatLastRun(dataset.lastRun)}
                      </td>
                      <td className="px-6 py-3"><FreshnessBadge freshness={dataset.freshness} /></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className="h-full bg-[#1D4ED8] rounded-full"
                              style={{ width: `${dataset.coverage}%` }}
                            />
                          </div>
                          <span
                            className="text-sm font-semibold text-[#334155] min-w-[3rem]"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                            title="% of expected records received and validated"
                          >
                            {dataset.coverage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#94A3B8]">{dataset.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Ingestion Runs */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Ingestion Runs</h3>
            {ingestionRuns.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No ingestion runs yet — use <code className="font-mono text-xs bg-gray-100 px-1 rounded">POST /api/ingest/facts</code> to push data.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2 text-left">Source / Feed</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Started</th>
                      <th className="px-4 py-2 text-right">Loaded</th>
                      <th className="px-4 py-2 text-right">Rejected</th>
                      <th className="px-4 py-2 text-left">File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ingestionRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {run.sourceSystem}
                          <span className="block text-xs text-gray-400 font-normal">{run.sourceFeedName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRunStatusColor(run.status)}`}>
                            {run.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{run.recordsLoaded ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{run.recordsRejected ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[180px]">
                          {run.fileManifests[0]?.sourceFileName ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 mt-4 border border-[#0284C7]/15 bg-gradient-to-r from-[#EFF6FF] to-[#E0F2FE]">
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 2px 6px rgba(2,132,199,0.3)' }}
              >
                <Info className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#0F172A] mb-1">Data Freshness Guidelines</h4>
                <p className="text-sm text-[#334155]">
                  <span className="font-semibold">Fresh:</span> Within expected refresh window.
                  <span className="font-semibold ml-3">Lag:</span> Delayed but usable.
                  <span className="font-semibold ml-3">Stale:</span> Needs attention.
                  <span className="font-semibold ml-3">Coverage:</span>{' '}
                  % of expected records received and validated in this drop.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="mt-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: 'var(--card-shadow)' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#0F172A]">Dataset Mapping Status</h3>
                  <Button
                    size="sm"
                    onClick={() => setWizardOpen(true)}
                    className="gap-1.5 rounded-xl text-white"
                    style={{
                      background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                      boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload New Mapping
                  </Button>
                </div>
                <div className="space-y-3">
                  {configs.map((config) => (
                    <motion.div
                      key={config.id}
                      whileHover={{ y: -1 }}
                      className="flex items-center justify-between p-4 border border-[#F1F5F9] rounded-xl hover:bg-[#FAFBFC] hover:border-[#E2E8F0] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          config.status === 'Configured' ? 'bg-[#F0FDF4]' : 'bg-[#FFFBEB]'
                        }`}>
                          {config.status === 'Configured' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#0F172A]">{config.dataset}</div>
                          <div className="text-[11px] text-[#94A3B8]">
                            Last updated: {new Date(config.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`rounded-full border font-semibold text-[11px] ${
                          config.status === 'Configured'
                            ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                        }`}>
                          {config.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={(e) => { e.stopPropagation(); openEdit(config); }}
                        >
                          Edit
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: 'var(--card-shadow)' }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-[#64748B]" />
                  <h3 className="font-semibold text-[#0F172A]">Recently Published Mappings</h3>
                </div>
                <div className="space-y-3">
                  {publishedMappings.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between p-3 border border-[#F1F5F9] rounded-xl hover:bg-[#FAFBFC] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[#0F172A]">{mapping.name}</div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {mapping.dataset} · {mapping.fieldCount} fields · Published by {mapping.publishedBy}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#94A3B8]">
                          {new Date(mapping.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge className={`rounded-full border text-[10px] font-semibold ${
                          mapping.status === 'Active'
                            ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'
                        }`}>
                          {mapping.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <UploadMappingWizard brand={brandCode} open={wizardOpen} onClose={() => setWizardOpen(false)} />
        </TabsContent>

        <TabsContent value="normalization" className="mt-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
              <h3 className="font-semibold text-[#0F172A] mb-4">SP Status Value Mapping</h3>
              <p className="text-sm text-[#64748B] mb-4">
                Map hub partner status values to normalized categories for consistent insight generation
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Hub Partner Value</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Normalized Value</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#334155]">{rule.hubValue}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="rounded-full text-[11px]">{rule.normalizedValue}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="rounded-full text-[11px]">{rule.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}>Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
              <h3 className="font-semibold text-[#0F172A] mb-4">ID Crosswalk Status</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {crosswalkStats.map((stat) => {
                  const color = stat.matchRate >= 95 ? '#16A34A' : stat.matchRate >= 85 ? '#D97706' : '#DC2626';
                  return (
                    <div key={stat.statType} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                      <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">{stat.label}</div>
                      <div className="text-2xl font-semibold text-[#0F172A] mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.matchRate}%</div>
                      <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.matchRate}%` }}
                          transition={{ duration: 0.8 }}
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="unmatched">
                  <AccordionTrigger className="text-sm">
                    {(() => {
                      const parts = crosswalkStats
                        .filter(s => s.unmatchedCount > 0 && s.entityType)
                        .map(s => `${s.unmatchedCount} ${s.entityType}s`);
                      return parts.length > 0
                        ? `View Unmatched Records (${parts.join(', ')})`
                        : 'View Unmatched Records';
                    })()}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
                      {crosswalkStats.filter(s => s.unmatchedCount > 0).length === 0 ? (
                        <p className="text-sm text-[#64748B]">No unmatched records found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] text-[#94A3B8] uppercase tracking-wider">
                              <th className="text-left pb-2">Dataset</th>
                              <th className="text-right pb-2">Unmatched</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {crosswalkStats.filter(s => s.unmatchedCount > 0).map(s => (
                              <tr key={s.statType}>
                                <td className="py-2 text-[#334155]">{s.label}</td>
                                <td className="py-2 text-right font-semibold text-[#DC2626]">{s.unmatchedCount} {s.entityType}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Status Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-mapping-title" className="bg-white rounded-2xl border border-[#E2E8F0] p-6 w-80 shadow-xl">
            <h3 id="edit-mapping-title" className="font-semibold text-[#0F172A] mb-4">Edit Mapping Status</h3>
            <p className="text-sm text-[#64748B] mb-3">{editingConfig.dataset}</p>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] mb-4 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
            >
              <option value="Configured">Configured</option>
              <option value="Needs review">Needs review</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingConfig(null)}>
                Cancel
              </Button>
              <Button size="sm" className="rounded-xl" onClick={saveEdit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Normalization Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-rule-title" className="bg-white rounded-2xl border border-[#E2E8F0] p-6 w-96 shadow-xl">
            <h3 id="edit-rule-title" className="font-semibold text-[#0F172A] mb-1">Edit Normalization Rule</h3>
            <p className="text-xs text-[#94A3B8] mb-4">Hub value: <span className="font-mono text-[#334155]">{editingRule.hubValue}</span></p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Normalized Value</label>
                <input
                  type="text"
                  value={editNormalizedValue}
                  onChange={(e) => setEditNormalizedValue(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                >
                  <option value="Investigation">Investigation</option>
                  <option value="Access">Access</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Fulfillment">Fulfillment</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingRule(null)}>Cancel</Button>
              <Button size="sm" className="rounded-xl" onClick={saveEditRule}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Upload, Play, CheckCircle2, AlertTriangle, Clock, Info, Plus, History, ArrowUpDown } from 'lucide-react';
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

interface Props {
  datasets: Dataset[];
  mappingConfigs: MappingConfig[];
  normalizationRules: NormalizationRule[];
  publishedMappings: PublishedMapping[];
  dataRun: DataRun | null;
  brandCode: string;
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
}: Props) {
  const [activeTab, setActiveTab] = useState('status');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MappingConfig | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [configs, setConfigs] = useState<MappingConfig[]>(mappingConfigs);

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
          <Button variant="outline" className="gap-2">
            <Play className="w-4 h-4" />
            Test on Sample
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
                    {normalizationRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#334155]">{rule.hubValue}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="rounded-full text-[11px]">{rule.normalizedValue}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="rounded-full text-[11px]">{rule.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm">Edit</Button>
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
                {[
                  { label: 'NPI Coverage', value: 94.2, color: '#16A34A' },
                  { label: 'Account ID Match Rate', value: 97.8, color: '#16A34A' },
                  { label: 'Territory Alignment', value: 100, color: '#16A34A' },
                ].map((item) => (
                  <div key={item.label} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                    <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">{item.label}</div>
                    <div className="text-2xl font-semibold text-[#0F172A] mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}%</div>
                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="unmatched">
                  <AccordionTrigger className="text-sm">
                    View Unmatched Records (23 HCPs, 14 Accounts)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-[#F8FAFC] rounded-xl p-4 text-sm text-[#64748B] border border-[#F1F5F9]">
                      Detailed unmatched records and resolution tools would appear here
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
    </div>
  );
}

import React, { useState } from 'react';
import { Upload, Play, CheckCircle2, AlertTriangle, Clock, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

interface Dataset {
  name: string;
  displayName: string;
  lastRun: string;
  freshness: 'Fresh' | 'Stale' | 'Lag';
  coverage: string;
  notes: string;
}

const datasets: Dataset[] = [
  { name: 'claims_weekly', displayName: 'Claims (Weekly)', lastRun: '2026-03-05 06:10 ET', freshness: 'Fresh', coverage: '99.2%', notes: 'All claims processed' },
  { name: 'dispense_weekly', displayName: 'Dispense (Weekly)', lastRun: '2026-03-05 06:15 ET', freshness: 'Fresh', coverage: '97.8%', notes: 'Normal operation' },
  { name: 'shipments_weekly', displayName: 'Shipments (Weekly)', lastRun: '2026-03-05 05:45 ET', freshness: 'Fresh', coverage: '100%', notes: 'Complete' },
  { name: 'sp_cases', displayName: 'SP Cases', lastRun: '2026-03-03 14:20 ET', freshness: 'Lag', coverage: '94.5%', notes: '48h lag from hub partner' },
  { name: 'calls', displayName: 'Call Data', lastRun: '2026-03-05 02:30 ET', freshness: 'Fresh', coverage: '89.3%', notes: '2 territories missing' },
  { name: 'hcp_master', displayName: 'HCP Master', lastRun: '2026-03-04 23:00 ET', freshness: 'Fresh', coverage: '100%', notes: 'Daily refresh' },
  { name: 'account_master', displayName: 'Account Master', lastRun: '2026-03-04 23:05 ET', freshness: 'Fresh', coverage: '100%', notes: 'Daily refresh' },
  { name: 'affiliations', displayName: 'Affiliations', lastRun: '2026-03-04 23:10 ET', freshness: 'Fresh', coverage: '87.6%', notes: 'Weekly updates' },
  { name: 'territory_alignment', displayName: 'Territory Alignment', lastRun: '2026-03-01 00:00 ET', freshness: 'Stale', coverage: '100%', notes: 'Update pending' },
  { name: 'rep_roster', displayName: 'Rep Roster', lastRun: '2026-03-04 23:15 ET', freshness: 'Fresh', coverage: '100%', notes: 'Current' },
  { name: 'product_dim', displayName: 'Product Dimension', lastRun: '2026-03-01 00:00 ET', freshness: 'Fresh', coverage: '100%', notes: 'Static reference' },
];

const mappingConfigs = [
  { dataset: 'Claims', status: 'Configured', lastUpdated: '2025-12-15' },
  { dataset: 'Dispense', status: 'Configured', lastUpdated: '2025-12-15' },
  { dataset: 'SP Cases', status: 'Needs review', lastUpdated: '2025-11-20' },
  { dataset: 'Calls', status: 'Configured', lastUpdated: '2026-01-10' },
];

const spStatusMapping = [
  { hubValue: 'Pending Benefit Investigation', normalizedValue: 'Pending BI', category: 'Investigation' },
  { hubValue: 'Pending PA', normalizedValue: 'Pending PA', category: 'Access' },
  { hubValue: 'Pending Patient Outreach', normalizedValue: 'Pending Outreach', category: 'Engagement' },
  { hubValue: 'Approved - Pending Shipment', normalizedValue: 'Approved', category: 'Fulfillment' },
  { hubValue: 'Shipped', normalizedValue: 'Shipped', category: 'Fulfillment' },
  { hubValue: 'Completed', normalizedValue: 'Completed', category: 'Closed' },
  { hubValue: 'Abandoned', normalizedValue: 'Abandoned', category: 'Closed' },
];

const FreshnessIcon = ({ freshness }: { freshness: string }) => {
  if (freshness === 'Fresh') return <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />;
  if (freshness === 'Lag') return <Clock className="w-4 h-4 text-[#D97706]" />;
  return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />;
};

const FreshnessBadge = ({ freshness }: { freshness: string }) => {
  const colors = {
    Fresh: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    Lag: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    Stale: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  };
  return <Badge className={`rounded-full border font-semibold text-[11px] ${colors[freshness as keyof typeof colors]}`}>{freshness}</Badge>;
};

export default function DataMapping() {
  const [activeTab, setActiveTab] = useState('status');

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
          <p className="text-sm text-[#64748B]">
            Monitor data pipelines and manage configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
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
                      <td className="px-6 py-3 text-sm text-[#334155]" style={{ fontVariantNumeric: 'tabular-nums' }}>{dataset.lastRun}</td>
                      <td className="px-6 py-3"><FreshnessBadge freshness={dataset.freshness} /></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden max-w-[100px]">
                            <div className="h-full bg-[#1D4ED8] rounded-full" style={{ width: dataset.coverage }}></div>
                          </div>
                          <span className="text-sm font-semibold text-[#334155] min-w-[3rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>{dataset.coverage}</span>
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
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="mt-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0]" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="p-6">
              <h3 className="font-semibold text-[#0F172A] mb-4">Dataset Mapping Status</h3>
              <div className="space-y-3">
                {mappingConfigs.map((config) => (
                  <div key={config.dataset} className="flex items-center justify-between p-4 border border-[#F1F5F9] rounded-xl hover:bg-[#FAFBFC] transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm font-medium text-[#0F172A]">{config.dataset}</div>
                        <div className="text-[11px] text-[#94A3B8]">Last updated: {config.lastUpdated}</div>
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
                      <Button variant="outline" size="sm" className="rounded-xl">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] p-6">
              <h3 className="font-semibold text-[#0F172A] mb-3">Upload New Mapping</h3>
              <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center hover:border-[#93C5FD] hover:bg-[#F8FAFC] transition-colors">
                <Upload className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-sm text-[#64748B] mb-1">
                  Drop your mapping configuration file here or click to browse
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Supports JSON and YAML formats
                </p>
                <Button variant="outline" size="sm" className="mt-4 rounded-xl">
                  Select File
                </Button>
              </div>
            </div>
          </div>
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
                    {spStatusMapping.map((mapping, index) => (
                      <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#334155]">{mapping.hubValue}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="rounded-full text-[11px]">{mapping.normalizedValue}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="rounded-full text-[11px]">{mapping.category}</Badge>
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
                  { label: 'NPI Coverage', value: '94.2%', color: '#16A34A' },
                  { label: 'Account ID Match Rate', value: '97.8%', color: '#16A34A' },
                  { label: 'Territory Alignment', value: '100%', color: '#16A34A' },
                ].map((item) => (
                  <div key={item.label} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                    <div className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-2">{item.label}</div>
                    <div className="text-2xl font-semibold text-[#0F172A] mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: item.value }}
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
    </div>
  );
}

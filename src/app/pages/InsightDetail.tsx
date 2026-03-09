import React from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Share2, Download, UserPlus, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import PillarTag from '../components/PillarTag';
import SeverityBadge from '../components/SeverityBadge';
import ActionItem from '../components/ActionItem';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const metricChanges = [
  { metric: 'NRx Volume', before: '392', after: '345', change: '-47', changePercent: '-12%', type: 'down' },
  { metric: 'TRx Volume', before: '1,247', after: '1,198', change: '-49', changePercent: '-3.9%', type: 'down' },
  { metric: 'Market Share (NRx)', before: '6.8%', after: '5.9%', change: '-0.9%', changePercent: '-13%', type: 'down' },
];

const topContributors = [
  { entity: 'Memorial Health System', type: 'Parent Orgs', impact: '-18 NRx', percent: '38%' },
  { entity: 'Northeast Oncology Group', type: 'Parent Orgs', impact: '-14 NRx', percent: '30%' },
  { entity: 'Boston Cancer Center', type: 'Parent Orgs', impact: '-9 NRx', percent: '19%' },
  { entity: 'Territory T08', type: 'Territory', impact: '-6 NRx', percent: '13%' },
];

const drivers = [
  { driver: 'Execution (Coverage Drop)', confidence: 85, description: 'Call coverage down 23% for affected Accounts' },
  { driver: 'Start Ops (SP Resolution Time)', confidence: 62, description: 'SP cycle time increased but not fully explanatory' },
  { driver: 'Structure (Alignment Change)', confidence: 15, description: 'No significant territory/affiliation changes detected' },
];

const dataSources = ['Claims', 'Dispense', 'SP Cases', 'Call Data', 'Structure'];

export default function InsightDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <Link to="/insights">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="text-xs text-[#94A3B8] font-medium mb-1 uppercase tracking-wider">Insight Detail</div>
          <h1 className="text-xl font-semibold text-[#0F172A]">
            NRx down 12% WoW in Northeast; driven by 3 parent systems; not alignment-driven
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Assign
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Slide
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <PillarTag pillar="Demand" />
        <SeverityBadge severity="High" showIcon />
        <Badge className="rounded-full border bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] text-[11px] font-semibold">New</Badge>
        <span className="text-xs text-[#94A3B8]">Generated: 2026-03-05 06:10 ET</span>
      </div>

      {/* What Changed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">What Changed</h2>
        <div className="grid grid-cols-3 gap-4">
          {metricChanges.map((item) => (
            <div key={item.metric} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{item.metric}</div>
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <div className="text-[10px] text-[#94A3B8] uppercase">Before</div>
                  <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.before}</div>
                </div>
                <div className="text-[#CBD5E1] text-lg">→</div>
                <div>
                  <div className="text-[10px] text-[#94A3B8] uppercase">After</div>
                  <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.after}</div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${item.type === 'down' ? 'text-[#DC2626] bg-[#FEF2F2]' : 'text-[#16A34A] bg-[#F0FDF4]'}`}>
                {item.type === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                <span>{item.change} ({item.changePercent})</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Where It Changed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Where It Changed</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Impact</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {topContributors.map((item, index) => (
                <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-[#0F172A]">{item.entity}</td>
                  <td className="px-4 py-3.5 text-sm text-[#64748B]">{item.type}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#DC2626]">{item.impact}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#DC2626] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: item.percent }}
                          transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#334155] min-w-[3rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.percent}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Why It Changed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Why It Changed (Driver Hypothesis)</h2>
        <div className="space-y-4">
          {drivers.map((item, index) => (
            <div key={index} className="border border-[#F1F5F9] rounded-xl p-5 bg-[#FAFBFC]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-[#0F172A]">{item.driver}</h4>
                <Badge variant="outline" className="rounded-full font-semibold text-[11px]">
                  {item.confidence}% confidence
                </Badge>
              </div>
              <p className="text-sm text-[#64748B] mb-3">{item.description}</p>
              <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${item.confidence > 70 ? 'bg-[#16A34A]' : item.confidence > 40 ? 'bg-[#D97706]' : 'bg-[#CBD5E1]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.confidence}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Evidence</h2>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-8 flex items-center justify-center">
          <div className="text-center text-[#94A3B8]">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm">Trend charts and detailed analytics</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Data sources:</span>
          {dataSources.map((source) => (
            <Badge key={source} variant="outline" className="rounded-full text-[11px]">
              {source}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Recommended Actions</h2>
        <div className="space-y-3">
          <ActionItem
            title="Deep-dive call coverage for affected Parent Orgs with Regional Director"
            owner="Regional Director"
            dueDate="Mar 8, 2026"
            expectedLag="2-3 weeks"
            linkedInsight="NRx down 12% WoW in Northeast"
          />
          <ActionItem
            title="Validate data quality for Memorial Health System claims attribution"
            owner="Analytics Lead"
            dueDate="Mar 6, 2026"
            expectedLag="Immediate"
            linkedInsight="NRx down 12% WoW in Northeast"
          />
        </div>
      </div>

      {/* Notes & Decisions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Notes & Decisions</h2>
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
                >
                  JD
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#0F172A]">Jane Doe</span>
                    <span className="text-[11px] text-[#94A3B8]">2 hours ago</span>
                  </div>
                  <p className="text-sm text-[#334155] bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                    Confirmed with Memorial Health that no formulary changes occurred. Appears to be execution-related.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <textarea 
                placeholder="Add a note or decision..."
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                rows={3}
              />
              <Button size="sm" className="mt-2">
                Post Comment
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="discussion" className="mt-4">
            <p className="text-sm text-[#94A3B8]">No discussions yet.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
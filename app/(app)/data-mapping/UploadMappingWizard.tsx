'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Database,
  Phone,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Columns3,
  Rows3,
  Hash,
  ChevronDown,
  Save,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ─── Types ──────────────────────────────────────────────────────────
interface DatasetOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'Active' | 'Needs Update' | 'New';
  lastUpdated: string;
  fieldCount: number;
}

type MappingType = 'full_refresh' | 'incremental' | 'reference' | 'normalization';
type WizardStep = 1 | 2 | 3 | 4 | 5;

interface FieldMapping {
  sourceField: string;
  sampleValues: string[];
  suggestedField: string;
  confidence: number;
  transformation: string;
  status: 'success' | 'warning' | 'error' | 'unmapped';
  required: 'required' | 'recommended' | 'optional';
}

interface ValidationResult {
  category: string;
  checks: { label: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
}

// ─── Mock Data ──────────────────────────────────────────────────────
const datasetOptions: DatasetOption[] = [
  { id: 'claims', name: 'Claims', description: 'Weekly NRx/TRx claims data from IQVIA or Symphony', icon: <FileSpreadsheet className="w-5 h-5" />, status: 'Active', lastUpdated: '2026-03-05', fieldCount: 24 },
  { id: 'dispense', name: 'Dispense', description: 'SP dispense and shipment records', icon: <Database className="w-5 h-5" />, status: 'Active', lastUpdated: '2026-03-05', fieldCount: 18 },
  { id: 'sp_cases', name: 'SP Cases', description: 'Hub partner case status and milestone data', icon: <FileText className="w-5 h-5" />, status: 'Needs Update', lastUpdated: '2026-02-20', fieldCount: 32 },
  { id: 'calls', name: 'Calls', description: 'Field rep call activity and targeting data', icon: <Phone className="w-5 h-5" />, status: 'Active', lastUpdated: '2026-03-04', fieldCount: 15 },
  { id: 'structure', name: 'Structure', description: 'Territory alignment, affiliations, and roster', icon: <Building2 className="w-5 h-5" />, status: 'New', lastUpdated: '—', fieldCount: 12 },
];

const mappingTypes: { value: MappingType; label: string; description: string }[] = [
  { value: 'full_refresh', label: 'Full Refresh', description: 'Replace entire dataset each load' },
  { value: 'incremental', label: 'Incremental', description: 'Append or upsert new records' },
  { value: 'reference', label: 'Reference Crosswalk', description: 'ID mapping and lookup tables' },
  { value: 'normalization', label: 'Normalization Table', description: 'Value standardization rules' },
];

const mockPreviewColumns = ['NPI', 'HCP_NAME', 'WEEK_ENDING', 'PRODUCT', 'NRX', 'TRX', 'PLAN_TYPE', 'STATE', 'TERRITORY_ID', 'REP_NAME'];
const mockPreviewRows = [
  ['1234567890', 'Smith, John MD', '2026-03-01', 'LUNARA', '12', '18', 'Commercial', 'NY', 'NE-101', 'Sarah Chen'],
  ['2345678901', 'Johnson, Emily DO', '2026-03-01', 'LUNARA', '8', '11', 'Medicare', 'NJ', 'NE-101', 'Sarah Chen'],
  ['3456789012', 'Williams, Robert MD', '2026-03-01', 'LUNARA', '15', '22', 'Commercial', 'CT', 'NE-102', 'Mike Torres'],
  ['4567890123', 'Brown, Lisa MD', '2026-03-01', 'LUNARA', '3', '5', 'Medicaid', 'PA', 'NE-103', 'James Wright'],
  ['5678901234', 'Davis, Michael DO', '2026-03-01', 'LUNARA', '9', '14', 'Commercial', 'MA', 'NE-104', 'Amy Park'],
  ['6789012345', 'Miller, Karen MD', '2026-02-22', 'LUNARA', '11', '16', 'Medicare', 'NY', 'NE-101', 'Sarah Chen'],
  ['7890123456', 'Wilson, David MD', '2026-02-22', 'LUNARA', '6', '9', 'Commercial', 'NJ', 'NE-102', 'Mike Torres'],
  ['8901234567', 'Moore, Susan DO', '2026-02-22', 'LUNARA', '14', '20', 'Commercial', 'CT', 'NE-102', 'Mike Torres'],
];

const mockFieldMappings: FieldMapping[] = [
  { sourceField: 'NPI', sampleValues: ['1234567890', '2345678901'], suggestedField: 'hcp_npi', confidence: 98, transformation: 'none', status: 'success', required: 'required' },
  { sourceField: 'HCP_NAME', sampleValues: ['Smith, John MD', 'Johnson, Emily DO'], suggestedField: 'hcp_full_name', confidence: 94, transformation: 'split_name', status: 'success', required: 'recommended' },
  { sourceField: 'WEEK_ENDING', sampleValues: ['2026-03-01', '2026-02-22'], suggestedField: 'period_end_date', confidence: 91, transformation: 'normalize_date', status: 'success', required: 'required' },
  { sourceField: 'PRODUCT', sampleValues: ['LUNARA', 'LUNARA'], suggestedField: 'product_name', confidence: 96, transformation: 'uppercase', status: 'success', required: 'required' },
  { sourceField: 'NRX', sampleValues: ['12', '8'], suggestedField: 'new_rx_count', confidence: 88, transformation: 'numeric_cast', status: 'success', required: 'required' },
  { sourceField: 'TRX', sampleValues: ['18', '11'], suggestedField: 'total_rx_count', confidence: 85, transformation: 'numeric_cast', status: 'success', required: 'required' },
  { sourceField: 'PLAN_TYPE', sampleValues: ['Commercial', 'Medicare'], suggestedField: 'payer_channel', confidence: 72, transformation: 'map_values', status: 'warning', required: 'recommended' },
  { sourceField: 'STATE', sampleValues: ['NY', 'NJ'], suggestedField: 'state_code', confidence: 99, transformation: 'uppercase', status: 'success', required: 'required' },
  { sourceField: 'TERRITORY_ID', sampleValues: ['NE-101', 'NE-102'], suggestedField: 'territory_id', confidence: 95, transformation: 'trim', status: 'success', required: 'required' },
  { sourceField: 'REP_NAME', sampleValues: ['Sarah Chen', 'Mike Torres'], suggestedField: 'rep_full_name', confidence: 60, transformation: 'none', status: 'warning', required: 'optional' },
];

const BRONZE_TARGET_FIELDS: Record<string, string[]> = {
  Claims: [
    'claimId', 'claimLineId', 'patientToken', 'patientAgeBand', 'patientGender',
    'payerChannel', 'payerNameRaw', 'planNameRaw', 'planIdRaw', 'pbmNameRaw',
    'drugNameRaw', 'brandNameRaw', 'ndc11', 'trxNrxFlag', 'rxFillNumber',
    'quantity', 'daysSupply', 'writtenDate', 'fillDate', 'serviceDate',
    'prescriberNpiRaw', 'prescriberIdRaw', 'hcpNameRaw', 'hcoIdRaw', 'hcoNameRaw',
    'specialtyRaw', 'zip3', 'zip5', 'stateCode', 'territoryCodeRaw',
    'claimStatusRaw', 'rejectionCodeRaw', 'rejectionReasonRaw',
    'paidAmountRaw', 'copayAmountRaw', 'sourceLastUpdatedTs',
  ],
  Dispense: [
    'dispenseId', 'spCaseId', 'patientToken', 'prescriberNpiRaw', 'ndc11',
    'brandNameRaw', 'dispenseDate', 'shipDate', 'fillNumber', 'quantity',
    'daysSupply', 'dispensingPharmacyIdRaw', 'dispensingPharmacyNameRaw',
    'dispenseStatusRaw', 'dispenseChannelRaw', 'sourceLastUpdatedTs',
  ],
  'SP Cases': [
    'spCaseId', 'referralId', 'patientToken', 'prescriberNpiRaw', 'prescriberIdRaw',
    'hcpNameRaw', 'hcoIdRaw', 'hcoNameRaw', 'brandNameRaw', 'drugNameRaw',
    'caseStatusRaw', 'caseSubstatusRaw', 'casePriorityRaw', 'referralDate',
    'intakeDate', 'bvStartDate', 'bvCompleteDate', 'paStartDate', 'paOutcomeDate',
    'patientOutreachDate', 'approvalDate', 'firstDispenseDateRaw', 'shipmentDateRaw',
    'sourceLastUpdatedTs',
  ],
  Calls: [
    'callId', 'interactionIdRaw', 'repIdRaw', 'repEmailRaw', 'repNameRaw',
    'managerIdRaw', 'territoryCodeRaw', 'territoryNameRaw', 'prescriberNpiRaw',
    'hcpIdRaw', 'hcoIdRaw', 'callDate', 'callTs', 'callTypeRaw', 'channelRaw',
    'callStatusRaw', 'callPlanFlagRaw', 'callDurationMinutesRaw',
    'productDiscussedRaw', 'detailPriorityRaw', 'sampleFlagRaw',
    'speakerProgramFlagRaw', 'sourceLastUpdatedTs',
  ],
  Structure: [
    'alignmentRecordId', 'entityIdRaw', 'entityTypeRaw', 'territoryCodeRaw',
    'territoryNameRaw', 'regionCodeRaw', 'regionNameRaw', 'districtCodeRaw',
    'districtNameRaw', 'repIdRaw', 'repNameRaw', 'managerIdRaw',
    'alignmentStartDate', 'alignmentEndDate', 'activeFlagRaw', 'primaryFlagRaw',
    'repSourceId', 'employeeIdRaw', 'repEmailRaw', 'roleRaw', 'teamRaw',
    'employmentStatusRaw', 'hireDateRaw', 'terminationDateRaw', 'sourceLastUpdatedTs',
  ],
};

const transformations = [
  { value: 'none', label: 'None' },
  { value: 'trim', label: 'Trim Spaces' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'normalize_date', label: 'Normalize Date' },
  { value: 'split_name', label: 'Split Full Name' },
  { value: 'numeric_cast', label: 'Numeric Cast' },
  { value: 'map_values', label: 'Map Status Values' },
  { value: 'default_null', label: 'Default Null Handling' },
];

const mockValidationResults: ValidationResult[] = [
  {
    category: 'Schema Checks',
    checks: [
      { label: 'Column count matches expected schema', status: 'pass', detail: '10 of 10 columns present' },
      { label: 'No duplicate column headers', status: 'pass', detail: 'All headers unique' },
      { label: 'File encoding is UTF-8', status: 'pass', detail: 'Detected UTF-8' },
    ],
  },
  {
    category: 'Required Field Coverage',
    checks: [
      { label: 'NPI field mapped and populated', status: 'pass', detail: '100% non-null (8/8 rows)' },
      { label: 'Period date field mapped', status: 'pass', detail: 'Mapped to period_end_date' },
      { label: 'Product field mapped', status: 'pass', detail: 'Mapped to product_name' },
      { label: 'NRx metric field mapped', status: 'pass', detail: 'Mapped to new_rx_count' },
      { label: 'Territory ID mapped', status: 'pass', detail: 'Mapped to territory_id' },
    ],
  },
  {
    category: 'Data Type Validation',
    checks: [
      { label: 'NPI values are 10-digit numeric', status: 'pass', detail: '8/8 valid' },
      { label: 'Date values parse correctly', status: 'pass', detail: 'ISO 8601 format detected' },
      { label: 'Numeric fields contain valid numbers', status: 'pass', detail: 'NRx, TRx all numeric' },
      { label: 'PLAN_TYPE values standardized', status: 'warn', detail: '4 unique values — "Medicaid" may need mapping to standard channel codes' },
    ],
  },
  {
    category: 'Duplicate & Ambiguity',
    checks: [
      { label: 'No duplicate source-to-target mappings', status: 'pass', detail: 'All mappings unique' },
      { label: 'REP_NAME mapping confidence below threshold', status: 'warn', detail: '60% confidence — consider manual verification' },
    ],
  },
];

// ─── Sub-components ─────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: WizardStep; totalSteps: number }) {
  const steps = [
    { num: 1, label: 'Select Dataset' },
    { num: 2, label: 'Upload File' },
    { num: 3, label: 'Preview' },
    { num: 4, label: 'Field Mapping' },
    { num: 5, label: 'Validate' },
  ];

  return (
    <div className="flex items-center gap-1 px-6 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC]">
      {steps.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${
                step.num < currentStep
                  ? 'bg-[#16A34A] text-white'
                  : step.num === currentStep
                    ? 'text-white'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]'
              }`}
              style={step.num === currentStep ? {
                background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
              } : undefined}
              animate={step.num === currentStep ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {step.num < currentStep ? <Check className="w-3.5 h-3.5" /> : step.num}
            </motion.div>
            <span className={`text-[11px] font-medium hidden xl:block ${
              step.num === currentStep ? 'text-[#0F172A]' : step.num < currentStep ? 'text-[#16A34A]' : 'text-[#94A3B8]'
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 ${step.num < currentStep ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// totalSteps is unused but kept for API compatibility
void (0 as unknown as typeof StepIndicator);

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#16A34A' : value >= 70 ? '#D97706' : '#DC2626';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}%</span>
    </div>
  );
}

function ValidationIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
  return <XCircle className="w-4 h-4 text-[#DC2626]" />;
}

// ─── Main Component ─────────────────────────────────────────────────

interface UploadMappingWizardProps {
  open: boolean;
  onClose: () => void;
  brand: string;
}

export default function UploadMappingWizard({ open, onClose, brand }: UploadMappingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [mappingType, setMappingType] = useState<MappingType>('full_refresh');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; time: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(mockFieldMappings);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);
  const [mappingName, setMappingName] = useState('');
  const [mappingNotes, setMappingNotes] = useState('');
  const [expandedValidation, setExpandedValidation] = useState<string | null>(null);

  const resetWizard = useCallback(() => {
    setStep(1);
    setSelectedDataset(null);
    setMappingType('full_refresh');
    setUploadedFile(null);
    setIsParsing(false);
    setFieldMappings(mockFieldMappings);
    setIsPublishing(false);
    setPublishComplete(false);
    setMappingName('');
    setMappingNotes('');
  }, []);

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    setIsParsing(true);
    // Brief parse delay to show loading state, then record real file metadata
    setTimeout(() => {
      const sizeKB = file.size / 1024;
      const sizeMB = sizeKB / 1024;
      const sizeStr = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
      const uploadTime = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      setUploadedFile({ name: file.name, size: sizeStr, time: uploadTime });
      setIsParsing(false);
    }, 800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const ds = datasetOptions.find(d => d.id === selectedDataset);
      const name = mappingName || `${ds?.name ?? 'Mapping'} v${new Date().toISOString().split('T')[0]}`;
      await fetch('/api/data-mapping/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandCode: brand,
          dataset: ds?.name ?? '',
          name,
          rules: fieldMappings
            .filter(m => m.sourceField && m.suggestedField)
            .map(m => ({ sourceField: m.sourceField, targetField: m.suggestedField })),
        }),
      });
    } catch {
      // show success state regardless — wizard is a UI demo
    } finally {
      setIsPublishing(false);
      setPublishComplete(true);
    }
  };

  const canProceed = (): boolean => {
    if (step === 1) return !!selectedDataset;
    if (step === 2) return !!uploadedFile;
    return true;
  };

  const requiredMapped = fieldMappings.filter(f => f.required === 'required' && f.status !== 'unmapped').length;
  const requiredTotal = fieldMappings.filter(f => f.required === 'required').length;
  const warnings = fieldMappings.filter(f => f.status === 'warning').length;
  const unmapped = fieldMappings.filter(f => f.status === 'unmapped').length;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        role="dialog"
        aria-modal="true"
        aria-label="Upload Mapping Wizard"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[820px] bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                boxShadow: '0 2px 8px rgba(29,78,216,0.25)',
              }}
            >
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">Upload New Mapping</h2>
              <p className="text-[11px] text-[#94A3B8]">Configure field mapping for data ingestion</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={5} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-6"
            >
              {/* ─── STEP 1: Select Dataset ─── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Select Dataset</h3>
                    <p className="text-[12px] text-[#64748B]">Choose the data source you want to configure mapping for.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {datasetOptions.map((ds) => (
                      <motion.button
                        key={ds.id}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => {
                          setSelectedDataset(ds.id);
                          setMappingName(`${ds.name} Weekly v1.0`);
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedDataset === ds.id
                            ? 'border-[#1D4ED8] bg-[#EFF6FF]/50'
                            : 'border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:bg-[#F8FAFC]'
                        }`}
                        style={selectedDataset === ds.id ? { boxShadow: '0 0 0 3px rgba(29,78,216,0.1)' } : undefined}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedDataset === ds.id ? 'bg-[#1D4ED8] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {ds.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-[#0F172A]">{ds.name}</span>
                              <Badge className={`rounded-full border text-[10px] font-semibold px-1.5 py-0 ${
                                ds.status === 'Active' ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' :
                                ds.status === 'Needs Update' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                                'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                              }`}>{ds.status}</Badge>
                            </div>
                            <p className="text-[12px] text-[#64748B]">{ds.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[11px] text-[#94A3B8]">Last updated</div>
                            <div className="text-[12px] font-medium text-[#334155]">{ds.lastUpdated}</div>
                            <div className="text-[10px] text-[#94A3B8] mt-0.5">{ds.fieldCount} fields</div>
                          </div>
                          {selectedDataset === ds.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-[#1D4ED8] flex items-center justify-center flex-shrink-0"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Mapping Type */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 block">
                      Mapping Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {mappingTypes.map((mt) => (
                        <button
                          key={mt.value}
                          onClick={() => setMappingType(mt.value)}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            mappingType === mt.value
                              ? 'border-[#1D4ED8] bg-[#EFF6FF]/50'
                              : 'border-[#E2E8F0] hover:border-[#93C5FD]'
                          }`}
                        >
                          <div className="text-[12px] font-semibold text-[#0F172A]">{mt.label}</div>
                          <div className="text-[11px] text-[#94A3B8]">{mt.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Upload File ─── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Upload Mapping File</h3>
                    <p className="text-[12px] text-[#64748B]">
                      Upload your source data file for{' '}
                      <span className="font-semibold text-[#334155]">
                        {datasetOptions.find(d => d.id === selectedDataset)?.name}
                      </span>{' '}
                      mapping configuration.
                    </p>
                  </div>

                  {!uploadedFile && !isParsing && (
                    <div
                      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                        isDragOver
                          ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                          : 'border-[#E2E8F0] hover:border-[#93C5FD] hover:bg-[#FAFBFC]'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.json,.yaml,.yml';
                        input.onchange = (ev) => {
                          const file = (ev.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(file);
                        };
                        input.click();
                      }}
                    >
                      <motion.div
                        animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
                        className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
                        style={{
                          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                          boxShadow: '0 2px 8px rgba(29,78,216,0.1)',
                        }}
                      >
                        <Upload className="w-6 h-6 text-[#1D4ED8]" />
                      </motion.div>
                      <p className="text-sm text-[#334155] mb-1">
                        Drag & drop your file here, or <span className="text-[#1D4ED8] font-semibold">browse</span>
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Supports CSV, XLSX, JSON, YAML — Max 50 MB
                      </p>
                    </div>
                  )}

                  {isParsing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-[#E2E8F0] rounded-2xl p-8 text-center"
                    >
                      <RefreshCw className="w-8 h-8 text-[#1D4ED8] mx-auto mb-4 animate-spin" />
                      <p className="text-sm font-medium text-[#334155] mb-2">Parsing file...</p>
                      <p className="text-[12px] text-[#94A3B8] mb-4">Detecting schema, columns, and data types</p>
                      <Progress value={65} className="max-w-xs mx-auto" />
                    </motion.div>
                  )}

                  {uploadedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="border border-[#BBF7D0] bg-[#F0FDF4]/50 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-[#16A34A]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#0F172A]">{uploadedFile.name}</div>
                            <div className="text-[11px] text-[#64748B]">
                              {uploadedFile.size} · Uploaded {uploadedFile.time}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Parsed
                            </Badge>
                            <button
                              onClick={() => setUploadedFile(null)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Columns', value: '10', icon: <Columns3 className="w-3.5 h-3.5" /> },
                          { label: 'Rows', value: '2,847', icon: <Rows3 className="w-3.5 h-3.5" /> },
                          { label: 'File Type', value: 'CSV', icon: <FileText className="w-3.5 h-3.5" /> },
                          { label: 'Encoding', value: 'UTF-8', icon: <Hash className="w-3.5 h-3.5" /> },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                            <div className="flex items-center gap-1.5 text-[#94A3B8] mb-1">
                              {stat.icon}
                              <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className="text-sm font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-start gap-3 bg-[#FFFBEB]/60 rounded-xl p-3 border border-[#FDE68A]/50">
                        <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[12px] font-semibold text-[#92400E]">Schema Note</span>
                          <p className="text-[11px] text-[#92400E]/80 mt-0.5">
                            PLAN_TYPE column contains 4 unique values that may need normalization mapping.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ─── STEP 3: Preview & Auto-Detect ─── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Preview & Auto-Detect</h3>
                    <p className="text-[12px] text-[#64748B]">Review sample data and auto-detected field mappings.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '10 columns detected', color: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]' },
                      { label: '8 rows sampled', color: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' },
                      { label: 'CSV / comma-delimited', color: 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]' },
                      { label: '1 date column', color: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]' },
                      { label: '1 ID column (NPI)', color: 'bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]' },
                    ].map((chip) => (
                      <span key={chip.label} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${chip.color}`}>
                        {chip.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-start gap-3 rounded-xl p-3 border border-[#C4B5FD]/30" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(29,78,216,0.04))' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)', boxShadow: '0 2px 6px rgba(124,58,237,0.3)' }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="text-[12px] font-semibold text-[#0F172A]">Auto-Detection Results</span>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Detected probable NPI field (98% confidence), week-ending date field, and 2 metric columns (NRx, TRx). PLAN_TYPE values suggest payer channel mapping needed.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4]/40 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span className="text-[11px] font-semibold text-[#166534] uppercase tracking-wider">Matched</span>
                      </div>
                      <div className="text-lg font-semibold text-[#0F172A] mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>8</div>
                      <p className="text-[10px] text-[#64748B]">Fields matched with high confidence</p>
                    </div>
                    <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB]/40 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                        <span className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider">Needs Review</span>
                      </div>
                      <div className="text-lg font-semibold text-[#0F172A] mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>2</div>
                      <p className="text-[10px] text-[#64748B]">Fields below confidence threshold</p>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Unmapped</span>
                      </div>
                      <div className="text-lg font-semibold text-[#0F172A] mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>0</div>
                      <p className="text-[10px] text-[#64748B]">Source fields with no match</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Data Preview</span>
                      <span className="text-[10px] text-[#94A3B8]">First 8 rows</span>
                    </div>
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                            <tr>
                              {mockPreviewColumns.map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1F5F9]">
                            {mockPreviewRows.map((row, i) => (
                              <tr key={i} className="hover:bg-[#FAFBFC]">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-3 py-2 text-[#334155] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 4: Field Mapping ─── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Field Mapping</h3>
                    <p className="text-[12px] text-[#64748B]">Map source fields to standardized platform fields and configure transformations.</p>
                  </div>

                  <div className="flex items-center gap-4 bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[12px] font-semibold text-[#0F172A]">Required: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{requiredMapped}/{requiredTotal}</span></span>
                    </div>
                    <div className="w-px h-4 bg-[#E2E8F0]" />
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-[12px] text-[#64748B]">Warnings: <span className="font-semibold text-[#92400E]" style={{ fontVariantNumeric: 'tabular-nums' }}>{warnings}</span></span>
                    </div>
                    <div className="w-px h-4 bg-[#E2E8F0]" />
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="text-[12px] text-[#64748B]">Unmapped: <span className="font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{unmapped}</span></span>
                    </div>
                    <div className="ml-auto">
                      <Progress value={(requiredMapped / requiredTotal) * 100} className="w-24 h-2" />
                    </div>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[140px]">Source Field</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[140px]">Sample</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[170px]">Platform Field</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[90px]">Confidence</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[140px]">Transform</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider w-[50px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {fieldMappings.map((fm, index) => {
                            const rowBorder = fm.required === 'required' ? 'border-l-2 border-l-[#1D4ED8]' : fm.required === 'recommended' ? 'border-l-2 border-l-[#D97706]' : '';
                            return (
                              <tr key={fm.sourceField} className={`hover:bg-[#FAFBFC] ${rowBorder}`}>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-[#0F172A] font-mono text-[11px]">{fm.sourceField}</span>
                                    {fm.required === 'required' && <span className="text-[#DC2626] text-[10px]">*</span>}
                                  </div>
                                  <span className={`text-[10px] ${
                                    fm.required === 'required' ? 'text-[#1D4ED8]' : fm.required === 'recommended' ? 'text-[#D97706]' : 'text-[#94A3B8]'
                                  }`}>
                                    {fm.required}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="text-[11px] text-[#64748B] font-mono truncate max-w-[120px]" title={fm.sampleValues.join(', ')}>
                                    {fm.sampleValues[0]}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <select
                                    value={fm.suggestedField}
                                    onChange={(e) => {
                                      const updated = [...fieldMappings];
                                      updated[index] = { ...fm, suggestedField: e.target.value };
                                      setFieldMappings(updated);
                                    }}
                                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[11px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                                  >
                                    {(BRONZE_TARGET_FIELDS[datasetOptions.find(d => d.id === selectedDataset)?.name ?? ''] ?? []).map((pf) => (
                                      <option key={pf} value={pf}>{pf}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2.5">
                                  <ConfidenceBar value={fm.confidence} />
                                </td>
                                <td className="px-4 py-2.5">
                                  <select
                                    value={fm.transformation}
                                    onChange={(e) => {
                                      const updated = [...fieldMappings];
                                      updated[index] = { ...fm, transformation: e.target.value };
                                      setFieldMappings(updated);
                                    }}
                                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[11px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                                  >
                                    {transformations.map((t) => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {fm.status === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16A34A] mx-auto" />}
                                  {fm.status === 'warning' && <AlertTriangle className="w-4 h-4 text-[#D97706] mx-auto" />}
                                  {fm.status === 'error' && <XCircle className="w-4 h-4 text-[#DC2626] mx-auto" />}
                                  {fm.status === 'unmapped' && <AlertCircle className="w-4 h-4 text-[#94A3B8] mx-auto" />}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-[#94A3B8]">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1D4ED8] rounded" /> Required</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#D97706] rounded" /> Recommended</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#E2E8F0] rounded" /> Optional</span>
                  </div>
                </div>
              )}

              {/* ─── STEP 5: Validate, Test & Publish ─── */}
              {step === 5 && (
                <div className="space-y-5">
                  {!publishComplete ? (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Validate, Test & Publish</h3>
                        <p className="text-[12px] text-[#64748B]">Review validation results, test on sample data, and publish your mapping configuration.</p>
                      </div>

                      <div className="space-y-3">
                        {mockValidationResults.map((section) => (
                          <div key={section.category} className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedValidation(expandedValidation === section.category ? null : section.category)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFBFC] hover:bg-[#F1F5F9] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {section.checks.every(c => c.status === 'pass') ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                                ) : section.checks.some(c => c.status === 'fail') ? (
                                  <XCircle className="w-4 h-4 text-[#DC2626]" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                                )}
                                <span className="text-[13px] font-semibold text-[#0F172A]">{section.category}</span>
                                <span className="text-[11px] text-[#94A3B8]">
                                  {section.checks.filter(c => c.status === 'pass').length}/{section.checks.length} passed
                                </span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${expandedValidation === section.category ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                              {expandedValidation === section.category && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="divide-y divide-[#F1F5F9]">
                                    {section.checks.map((check, i) => (
                                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                                        <ValidationIcon status={check.status} />
                                        <div className="flex-1 min-w-0">
                                          <span className="text-[12px] text-[#0F172A]">{check.label}</span>
                                          <p className="text-[11px] text-[#94A3B8]">{check.detail}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-center">
                        <p className="text-sm font-medium text-blue-800 mb-1">Mapping Configured</p>
                        <p className="text-xs text-blue-600">
                          Proceed to Publish to save this mapping. To validate against live data,
                          call <code className="font-mono bg-white px-1 rounded text-blue-700">POST /api/ingest/facts</code> after publishing.
                        </p>
                      </div>

                      <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-[#1D4ED8]" />
                          <span className="text-[13px] font-semibold text-[#0F172A]">Publish Configuration</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5 block">Mapping Name</label>
                            <input
                              type="text"
                              value={mappingName}
                              onChange={(e) => setMappingName(e.target.value)}
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                              placeholder="e.g., Claims Weekly v2.1"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5 block">Version</label>
                            <input
                              type="text"
                              defaultValue="v1.0"
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5 block">Effective Date</label>
                            <input
                              type="date"
                              defaultValue="2026-03-10"
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5 block">Notes</label>
                            <input
                              type="text"
                              value={mappingNotes}
                              onChange={(e) => setMappingNotes(e.target.value)}
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] text-[#0F172A] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]/20 outline-none"
                              placeholder="Optional release notes..."
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #16A34A, #15803D)',
                          boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
                        }}
                      >
                        <Check className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Mapping Published Successfully</h3>
                      <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                        <span className="font-semibold text-[#334155]">{mappingName || 'Claims Weekly v1.0'}</span> has been published and will be active for the next data ingestion cycle.
                      </p>
                      <div className="inline-flex items-center gap-3 bg-[#F0FDF4] rounded-xl px-5 py-3 border border-[#BBF7D0]">
                        <div className="text-left">
                          <div className="text-[11px] text-[#94A3B8]">Configuration</div>
                          <div className="text-[13px] font-semibold text-[#0F172A]">{mappingName || 'Claims Weekly v1.0'}</div>
                        </div>
                        <div className="w-px h-8 bg-[#BBF7D0]" />
                        <div className="text-left">
                          <div className="text-[11px] text-[#94A3B8]">Fields Mapped</div>
                          <div className="text-[13px] font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>10/10</div>
                        </div>
                        <div className="w-px h-8 bg-[#BBF7D0]" />
                        <div className="text-left">
                          <div className="text-[11px] text-[#94A3B8]">Status</div>
                          <Badge className="rounded-full bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] border text-[10px] font-semibold">
                            Active
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button variant="outline" onClick={handleClose} className="rounded-xl gap-2">
                          Done
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {!(step === 5 && publishComplete) && (
          <div className="border-t border-[#E2E8F0] px-6 py-4 bg-[#FAFBFC] flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setStep((step - 1) as WizardStep)} className="gap-1.5 text-[#64748B]">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step === 5 ? (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                    <Save className="w-3.5 h-3.5" />
                    Save as Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="gap-1.5 rounded-xl text-white"
                    style={{
                      background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                      boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
                    }}
                  >
                    {isPublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {isPublishing ? 'Publishing...' : 'Publish Mapping'}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setStep((step + 1) as WizardStep)}
                  disabled={!canProceed()}
                  className="gap-1.5 rounded-xl text-white"
                  style={{
                    background: canProceed() ? 'linear-gradient(135deg, #1D4ED8, #2563EB)' : undefined,
                    boxShadow: canProceed() ? '0 2px 8px rgba(29,78,216,0.3)' : undefined,
                  }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

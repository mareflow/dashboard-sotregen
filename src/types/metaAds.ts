export interface MetaInsightsSummary {
  balance?: number;
  spend: number;
  impressions: number;
  reach: number;
  frequency?: number;
  clicks: number;
  leads: number;
  purchases?: number;
  roas?: number;
  cpl: number;
  ctr: number;
  cpc: number;
  cpm: number;
  currency?: string;
}

export interface CampaignInsight {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency?: number;
  clicks: number;
  leads: number;
  purchases?: number;
  roas?: number;
  cpl: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export interface AdSetInsight {
  adsetId: string;
  adsetName: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency?: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

export interface AdInsight {
  adId: string;
  adName: string;
  adsetId: string;
  adsetName: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency?: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

export interface MetaInsightsResponse {
  summary: MetaInsightsSummary;
  campaigns: CampaignInsight[];
  adsets?: AdSetInsight[];
  ads?: AdInsight[];
  visibleMetrics?: string[];
  accountInfo?: {
    currency?: string;
    accountStatus?: number;
    spendCap?: number | null;
    balanceType?: string;
  };
}

export type UserRole = 'admin' | 'coordenador' | 'gestor';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
}


export type MetricKey =
  | 'balance'
  | 'spend'
  | 'leads'
  | 'cpl'
  | 'ctr'
  | 'cpc'
  | 'cpm'
  | 'clicks'
  | 'impressions'
  | 'reach'
  | 'frequency'
  | 'roas'
  | 'purchases';

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  category: 'finance' | 'conversion' | 'performance';
}

export const ALL_METRICS: MetricDefinition[] = [
  { key: 'balance', label: 'Saldo em Conta (R$)', category: 'finance' },
  { key: 'spend', label: 'Investimento (R$)', category: 'finance' },
  { key: 'leads', label: 'Leads', category: 'conversion' },
  { key: 'cpl', label: 'Custo por Lead (CPL)', category: 'conversion' },
  { key: 'ctr', label: 'CTR (%)', category: 'performance' },
  { key: 'cpc', label: 'CPC (R$)', category: 'finance' },
  { key: 'cpm', label: 'CPM (R$)', category: 'finance' },
  { key: 'clicks', label: 'Cliques', category: 'performance' },
  { key: 'impressions', label: 'Impressões', category: 'performance' },
  { key: 'reach', label: 'Alcance', category: 'performance' },
  { key: 'frequency', label: 'Frequência', category: 'performance' },
  { key: 'roas', label: 'ROAS', category: 'conversion' },
  { key: 'purchases', label: 'Vendas / Compras', category: 'conversion' },
];

export type DatePreset = '7d' | '14d' | '30d' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

import { supabase } from '../lib/supabaseClient';
import type {
  DateRange,
  MetaInsightsResponse,
  CampaignInsight,
  AdSetInsight,
  AdInsight,
} from '../types/metaAds';

const DEFAULT_WINDSOR_KEY = 'fe98bf89fbd0a64f1aac8f163f02ee42f0a4';

function getWindsorKey(): string {
  return import.meta.env.VITE_WINDSOR_API_KEY || DEFAULT_WINDSOR_KEY;
}

export interface WindsorAccountOption {
  accountId: string;
  accountName: string;
}

/**
 * Fetches all ad accounts detected in Windsor.ai (Meta Business Manager).
 */
export async function fetchWindsorAccounts(): Promise<WindsorAccountOption[]> {
  try {
    const key = getWindsorKey();
    const map = new Map<string, string>();

    // 1. Fetch all authorized Meta Ad accounts from the dedicated Facebook connector
    try {
      const fbUrl = `https://connectors.windsor.ai/facebook?api_key=${key}&fields=account_id,account_name`;
      const resFb = await fetch(fbUrl);
      if (resFb.ok) {
        const dataFb = await resFb.json();
        if (Array.isArray(dataFb?.data)) {
          for (const item of dataFb.data) {
            if (item.account_id) {
              map.set(
                String(item.account_id).trim(),
                String(item.account_name || 'Conta Meta').trim()
              );
            }
          }
        }
      }
    } catch (fbErr) {
      console.warn('Erro ao consultar conector Facebook no Windsor:', fbErr);
    }

    // 2. Fetch from All connector (last 30d) to merge any active accounts
    try {
      const allUrl = `https://connectors.windsor.ai/all?api_key=${key}&date_preset=last_30d&fields=account_id,account_name,campaign_id,spend`;
      const resAll = await fetch(allUrl);
      if (resAll.ok) {
        const dataAll = await resAll.json();
        if (Array.isArray(dataAll?.data)) {
          for (const item of dataAll.data) {
            if (item.account_id) {
              map.set(
                String(item.account_id).trim(),
                String(item.account_name || 'Conta Meta').trim()
              );
            }
          }
        }
      }
    } catch (allErr) {
      console.warn('Erro ao consultar conector All no Windsor:', allErr);
    }

    return Array.from(map.entries()).map(([accountId, accountName]) => ({
      accountId,
      accountName,
    }));
  } catch (err) {
    console.error('Error fetching Windsor accounts:', err);
    return [];
  }
}

/**
 * Fetches insights for a specific ad account via Windsor.ai connector in real-time.
 */
export async function fetchMetaInsights(
  adAccountInternalId: string,
  range: DateRange,
  shareToken?: string
): Promise<MetaInsightsResponse> {
  // 1. Fetch account configuration and permissions from Supabase
  const { data: adAccount, error: accError } = await supabase
    .from('meta_ad_accounts')
    .select(`
      id,
      account_id,
      account_name,
      balance_type,
      manual_balance,
      clients (
        id,
        name,
        visible_metrics,
        share_token,
        share_enabled
      )
    `)
    .eq('id', adAccountInternalId)
    .single();

  if (accError || !adAccount) {
    throw new Error('Conta de anúncios não encontrada no banco de dados.');
  }

  const clientInfo: any = adAccount.clients;
  if (shareToken) {
    if (!clientInfo?.share_enabled || clientInfo?.share_token !== shareToken) {
      throw new Error('Link de compartilhamento inválido ou desativado pela agência.');
    }
  }

  const visibleMetrics: string[] =
    clientInfo?.visible_metrics && clientInfo.visible_metrics.length > 0
      ? clientInfo.visible_metrics
      : [
          'balance',
          'spend',
          'leads',
          'cpl',
          'ctr',
          'cpc',
          'cpm',
          'clicks',
          'impressions',
          'reach',
          'frequency',
        ];

  const cleanAccountId = String(adAccount.account_id || '').replace(/^act_/, '').trim();

  // 2. Query Windsor.ai
  const key = getWindsorKey();
  const fields = [
    'account_id',
    'account_name',
    'campaign_id',
    'campaign',
    'adset_id',
    'adset_name',
    'ad_id',
    'ad_name',
    'clicks',
    'spend',
    'impressions',
    'reach',
    'actions_lead',
    'cost_per_action_type_lead',
    'cpc',
    'cpm',
    'ctr',
  ].join(',');

  const windsorUrl = `https://connectors.windsor.ai/all?api_key=${key}&date_from=${encodeURIComponent(
    range.since
  )}&date_to=${encodeURIComponent(range.until)}&fields=${fields}`;

  let windsorData: any = null;
  try {
    const res = await fetch(windsorUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.warn('Windsor API query returned non-200:', errText);
    } else {
      windsorData = await res.json();
    }
  } catch (fetchErr) {
    console.error('Error connecting to Windsor.ai:', fetchErr);
    throw new Error('Erro ao conectar à API de dados Windsor.ai.');
  }

  const allRows: any[] = Array.isArray(windsorData?.data) ? windsorData.data : [];

  // Filter rows for this specific account
  let matchedRows = allRows.filter((r) => {
    const rowAcc = String(r.account_id || '').replace(/^act_/, '').trim();
    return rowAcc === cleanAccountId;
  });

  // If no rows matched in 'all' connector, query the dedicated facebook connector directly
  if (matchedRows.length === 0) {
    try {
      const fbUrl = `https://connectors.windsor.ai/facebook?api_key=${key}&date_from=${encodeURIComponent(
        range.since
      )}&date_to=${encodeURIComponent(range.until)}&fields=${fields}`;
      const resFb = await fetch(fbUrl);
      if (resFb.ok) {
        const dataFb = await resFb.json();
        if (Array.isArray(dataFb?.data)) {
          matchedRows = dataFb.data.filter((r: any) => {
            const rowAcc = String(r.account_id || '').replace(/^act_/, '').trim();
            return rowAcc === cleanAccountId;
          });
        }
      }
    } catch (fbErr) {
      console.warn('Fallback FB connector error:', fbErr);
    }
  }

  // 3. Aggregate Ads
  const adsMap = new Map<string, any>();
  for (const row of matchedRows) {
    const adId = String(row.ad_id || row.campaign_id || Math.random().toString());
    const spend = parseFloat(row.spend || '0');
    const impressions = parseInt(row.impressions || '0', 10);
    const reach = parseInt(row.reach || '0', 10);
    const clicks = parseInt(row.clicks || '0', 10);
    const leads = parseFloat(row.actions_lead || '0');

    if (!adsMap.has(adId)) {
      adsMap.set(adId, {
        adId,
        adName: String(row.ad_name || 'Anúncio'),
        adsetId: String(row.adset_id || ''),
        adsetName: String(row.adset_name || ''),
        campaignId: String(row.campaign_id || ''),
        campaignName: String(row.campaign || ''),
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
      });
    }

    const existing = adsMap.get(adId);
    existing.spend += spend;
    existing.impressions += impressions;
    existing.reach += reach;
    existing.clicks += clicks;
    existing.leads += leads;
  }

  const ads: AdInsight[] = Array.from(adsMap.values()).map((ad) => {
    const cpl = ad.leads > 0 ? Number((ad.spend / ad.leads).toFixed(2)) : 0;
    const ctr = ad.impressions > 0 ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0;
    const cpc = ad.clicks > 0 ? Number((ad.spend / ad.clicks).toFixed(2)) : 0;
    return {
      ...ad,
      spend: Number(ad.spend.toFixed(2)),
      cpl,
      ctr,
      cpc,
    };
  });

  // 4. Aggregate Ad Sets
  const adsetsMap = new Map<string, any>();
  for (const ad of ads) {
    const adsetId = ad.adsetId || ad.campaignId || 'default_adset';
    if (!adsetsMap.has(adsetId)) {
      adsetsMap.set(adsetId, {
        adsetId,
        adsetName: ad.adsetName || 'Conjunto de Anúncios',
        campaignId: ad.campaignId,
        campaignName: ad.campaignName,
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
      });
    }
    const existing = adsetsMap.get(adsetId);
    existing.spend += ad.spend;
    existing.impressions += ad.impressions;
    existing.reach += ad.reach;
    existing.clicks += ad.clicks;
    existing.leads += ad.leads;
  }

  const adsets: AdSetInsight[] = Array.from(adsetsMap.values()).map((adset) => {
    const cpl = adset.leads > 0 ? Number((adset.spend / adset.leads).toFixed(2)) : 0;
    const ctr =
      adset.impressions > 0 ? Number(((adset.clicks / adset.impressions) * 100).toFixed(2)) : 0;
    const cpc = adset.clicks > 0 ? Number((adset.spend / adset.clicks).toFixed(2)) : 0;
    return {
      ...adset,
      spend: Number(adset.spend.toFixed(2)),
      cpl,
      ctr,
      cpc,
    };
  });

  // 5. Aggregate Campaigns
  const campaignsMap = new Map<string, any>();
  for (const adset of adsets) {
    const campId = adset.campaignId || 'default_campaign';
    if (!campaignsMap.has(campId)) {
      campaignsMap.set(campId, {
        campaignId: campId,
        campaignName: adset.campaignName || 'Campanha',
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
      });
    }
    const existing = campaignsMap.get(campId);
    existing.spend += adset.spend;
    existing.impressions += adset.impressions;
    existing.reach += adset.reach;
    existing.clicks += adset.clicks;
    existing.leads += adset.leads;
  }

  const campaigns: CampaignInsight[] = Array.from(campaignsMap.values()).map((camp) => {
    const cpl = camp.leads > 0 ? Number((camp.spend / camp.leads).toFixed(2)) : 0;
    const ctr =
      camp.impressions > 0 ? Number(((camp.clicks / camp.impressions) * 100).toFixed(2)) : 0;
    const cpc = camp.clicks > 0 ? Number((camp.spend / camp.clicks).toFixed(2)) : 0;
    const cpm = camp.impressions > 0 ? Number(((camp.spend / camp.impressions) * 1000).toFixed(2)) : 0;
    return {
      ...camp,
      spend: Number(camp.spend.toFixed(2)),
      cpl,
      ctr,
      cpc,
      cpm,
    };
  });

  // 6. Summary Totals
  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalReach = campaigns.reduce((acc, c) => acc + c.reach, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leads, 0);

  const totalCtr =
    totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const totalCpc = totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0;
  const totalCpl = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0;
  const totalCpm =
    totalImpressions > 0 ? Number(((totalSpend / totalImpressions) * 1000).toFixed(2)) : 0;
  const totalFrequency =
    totalReach > 0 ? Number((totalImpressions / totalReach).toFixed(2)) : 1;

  let accountBalance = 0;
  if (adAccount.balance_type === 'manual' && adAccount.manual_balance !== null) {
    accountBalance = Number(adAccount.manual_balance) || 0;
  }

  const summary = {
    balance: accountBalance,
    spend: Number(totalSpend.toFixed(2)),
    impressions: totalImpressions,
    reach: totalReach,
    frequency: totalFrequency,
    clicks: totalClicks,
    leads: totalLeads,
    cpl: totalCpl,
    ctr: totalCtr,
    cpc: totalCpc,
    cpm: totalCpm,
    currency: 'BRL',
  };

  return {
    summary,
    campaigns,
    adsets,
    ads,
    visibleMetrics,
    accountInfo: {
      currency: 'BRL',
      balanceType: adAccount.balance_type || 'manual',
    },
  };
}

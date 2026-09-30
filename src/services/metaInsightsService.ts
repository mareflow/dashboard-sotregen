import { supabase } from '../lib/supabaseClient';
import type { DateRange, MetaInsightsResponse } from '../types/metaAds';

export interface MetaInsightsError {
  message: string;
  code?: string;
  details?: string;
}

export async function fetchMetaInsights(
  adAccountInternalId: string,
  range: DateRange,
  shareToken?: string
): Promise<MetaInsightsResponse> {
  const { data, error } = await supabase.functions.invoke<MetaInsightsResponse>(
    'meta-insights',
    {
      body: {
        accountId: adAccountInternalId,
        since: range.since,
        until: range.until,
        shareToken,
      },
    }
  );

  if (error) {
    console.error('Edge Function invocation error:', error);
    if (error.context && typeof error.context === 'object') {
      try {
        const errorBody = await (error.context as Response).json();
        if (errorBody?.error) {
          throw new Error(errorBody.error);
        }
      } catch {
        // Fallback
      }
    }
    throw new Error(error.message || 'Não foi possível consultar os dados da Meta Ads. Tente novamente.');
  }

  if (!data) {
    throw new Error('Nenhum dado retornado pela consulta.');
  }

  return data;
}

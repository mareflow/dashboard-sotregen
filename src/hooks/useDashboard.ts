import { useState, useEffect, useCallback } from 'react';
import type { Client, MetaAdAccount } from '../types/database';
import type { DatePreset, DateRange, MetaInsightsResponse } from '../types/metaAds';
import { fetchClients, fetchAdAccounts } from '../services/clientService';
import { fetchMetaInsights } from '../services/metaInsightsService';
import { getDateRangeFromPreset } from '../lib/formatters';

export function useDashboard(isAuthenticated: boolean) {
  // Lists
  const [clients, setClients] = useState<Client[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);

  // Selections
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<MetaAdAccount | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('30d'));

  // Insights Data & Status
  const [insights, setInsights] = useState<MetaInsightsResponse | null>(null);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Clients
  const loadClients = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingClients(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
      if (data.length > 0) {
        // Keep current or select first
        setSelectedClient((prev) => (prev && data.some((c) => c.id === prev.id) ? prev : data[0]));
      } else {
        setSelectedClient(null);
        setSelectedAccount(null);
        setAdAccounts([]);
        setInsights(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar a lista de clientes.');
    } finally {
      setLoadingClients(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // 2. Fetch Ad Accounts when selectedClient changes
  const loadAccounts = useCallback(async () => {
    if (!selectedClient) {
      setAdAccounts([]);
      setSelectedAccount(null);
      setInsights(null);
      return;
    }
    setLoadingAccounts(true);
    setError(null);
    try {
      const data = await fetchAdAccounts(selectedClient.id);
      setAdAccounts(data);
      if (data.length > 0) {
        setSelectedAccount((prev) => (prev && data.some((a) => a.id === prev.id) ? prev : data[0]));
      } else {
        setSelectedAccount(null);
        setInsights(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar as contas de anúncios.');
    } finally {
      setLoadingAccounts(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // 3. Fetch Insights when selectedAccount or dateRange changes
  const loadInsights = useCallback(async () => {
    if (!selectedAccount) {
      setInsights(null);
      return;
    }

    setLoadingInsights(true);
    setError(null);

    try {
      const response = await fetchMetaInsights(selectedAccount.id, dateRange);
      setInsights(response);
    } catch (err: any) {
      console.error('Insights error:', err);
      setError(err.message || 'Não foi possível consultar a Meta Ads. Tente novamente.');
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }, [selectedAccount, dateRange]);

  useEffect(() => {
    if (selectedAccount) {
      loadInsights();
    }
  }, [selectedAccount, dateRange, loadInsights]);

  // Preset changer
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setDateRange(getDateRangeFromPreset(preset));
    }
  };

  const handleCustomDateChange = (range: DateRange) => {
    setDatePreset('custom');
    setDateRange(range);
  };

  return {
    clients,
    adAccounts,
    selectedClient,
    setSelectedClient,
    selectedAccount,
    setSelectedAccount,
    datePreset,
    dateRange,
    handlePresetChange,
    handleCustomDateChange,
    insights,
    loadingClients,
    loadingAccounts,
    loadingInsights,
    error,
    refreshInsights: loadInsights,
    reloadClients: loadClients,
    reloadAccounts: loadAccounts,
  };
}

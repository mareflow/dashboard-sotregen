import React, { useState, useEffect, useCallback } from 'react';
import {
  Waves,
  DollarSign,
  Users,
  Target,
  Percent,
  MousePointer,
  CreditCard,
  TrendingUp,
  Eye,
  RefreshCw,
  Layers,
  Wallet,
  Repeat,
  ShoppingBag,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { CampaignsTable } from '../components/CampaignsTable';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { fetchClientByShareToken } from '../services/clientService';
import { fetchMetaInsights } from '../services/metaInsightsService';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getDateRangeFromPreset,
} from '../lib/formatters';
import type { Client, MetaAdAccount } from '../types/database';
import type { DatePreset, DateRange, MetaInsightsResponse } from '../types/metaAds';

interface ClientPortalPageProps {
  shareToken: string;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ shareToken }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<MetaAdAccount | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('30d'));

  const [insights, setInsights] = useState<MetaInsightsResponse | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initClient() {
      setLoadingInitial(true);
      setError(null);
      try {
        const { client: fetchedClient, accounts: fetchedAccounts } =
          await fetchClientByShareToken(shareToken);
        setClient(fetchedClient);
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
          setSelectedAccount(fetchedAccounts[0]);
        }
      } catch (err: any) {
        console.error('Failed to load shared client:', err);
        setError(err.message || 'Link de compartilhamento inválido ou expirado.');
      } finally {
        setLoadingInitial(false);
      }
    }
    initClient();
  }, [shareToken]);

  const loadInsights = useCallback(async () => {
    if (!selectedAccount) return;
    setLoadingInsights(true);
    setError(null);
    try {
      const response = await fetchMetaInsights(selectedAccount.id, dateRange, shareToken);
      setInsights(response);
    } catch (err: any) {
      console.error('Insights error in client view:', err);
      setError(err.message || 'Não foi possível consultar os dados da Meta Ads no momento.');
    } finally {
      setLoadingInsights(false);
    }
  }, [selectedAccount, dateRange, shareToken]);

  useEffect(() => {
    if (selectedAccount) {
      loadInsights();
    }
  }, [selectedAccount, dateRange, loadInsights]);

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

  if (loadingInitial) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040914' }}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <EmptyState
          type="error"
          title="Acesso Indisponível"
          description={error}
        />
      </div>
    );
  }

  const visibleMetrics: string[] =
    insights?.visibleMetrics || client?.visible_metrics || [
      'balance', 'spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions', 'reach', 'frequency'
    ];

  const isVisible = (key: string) => visibleMetrics.includes(key);
  const summary = insights?.summary;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Client Header */}
      <header style={{
        borderBottom: '1px solid rgba(0, 168, 232, 0.2)',
        background: 'rgba(7, 18, 38, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 24px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand & Client Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00A8E8 0%, #002B5C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 168, 232, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <Waves size={24} color="#FFFFFF" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {client?.name}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(0, 168, 232, 0.15)',
                  color: '#00B4D8',
                  border: '1px solid rgba(0, 168, 232, 0.3)',
                }}>
                  Portal do Cliente
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '-2px' }}>
                Painel de Resultados de Tráfego Pago • Gerenciado por Maré Flow
              </p>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => loadInsights()}
            disabled={loadingInsights || !selectedAccount}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            <RefreshCw size={15} className={loadingInsights ? 'animate-spin' : ''} />
            {loadingInsights ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: '1360px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Controls Card */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            {/* Account Selector (if multiple) */}
            {accounts.length > 1 ? (
              <div style={{ minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Layers size={14} color="#00B4D8" />
                  <span className="form-label">Conta de Anúncios</span>
                </div>
                <select
                  value={selectedAccount?.id || ''}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value) || null;
                    setSelectedAccount(acc);
                  }}
                  className="form-select"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : accounts.length === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="#00A8E8" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E8F0' }}>
                  Conta: <strong>{accounts[0].account_name}</strong>
                </span>
              </div>
            ) : (
              <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Nenhuma conta vinculada</span>
            )}
          </div>

          {/* Date Picker */}
          <div style={{ borderTop: accounts.length > 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none', paddingTop: accounts.length > 1 ? '16px' : '0' }}>
            <DateRangeFilter
              currentPreset={datePreset}
              currentRange={dateRange}
              onPresetChange={handlePresetChange}
              onCustomRangeChange={handleCustomDateChange}
            />
          </div>
        </div>

        {/* Content Area */}
        {loadingInsights ? (
          <LoadingSkeleton />
        ) : error ? (
          <EmptyState
            type="error"
            errorDetails={error}
            actionText="Tentar novamente"
            onAction={() => loadInsights()}
          />
        ) : !insights || (insights.campaigns.length === 0 && (!summary || summary.spend === 0)) ? (
          <EmptyState
            type="no-data"
            description="Nenhuma atividade registrada para esta conta no período selecionado. Selecione um período maior acima."
          />
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Metric Cards (filtered strictly by visibleMetrics configured by agency) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '16px',
              }}
            >
              {isVisible('balance') && (
                <MetricCard
                  title="Saldo em Conta"
                  value={formatCurrency(summary?.balance || 0)}
                  subtitle="Saldo disponível / limite na Meta"
                  icon={Wallet}
                  accentColor="#34D399"
                />
              )}

              {isVisible('spend') && (
                <MetricCard
                  title="Investimento"
                  value={formatCurrency(summary?.spend || 0)}
                  subtitle="Total investido no período"
                  icon={DollarSign}
                  accentColor="#00A8E8"
                />
              )}

              {isVisible('leads') && (
                <MetricCard
                  title="Leads"
                  value={formatNumber(summary?.leads || 0)}
                  subtitle="Contatos qualificados gerados"
                  icon={Users}
                  accentColor="#10B981"
                />
              )}

              {isVisible('cpl') && (
                <MetricCard
                  title="Custo por Lead"
                  value={(summary?.leads || 0) > 0 ? formatCurrency(summary?.cpl || 0) : 'R$ 0,00'}
                  subtitle="CPL médio da conta"
                  icon={Target}
                  accentColor="#F59E0B"
                />
              )}

              {isVisible('purchases') && (
                <MetricCard
                  title="Vendas / Conversões"
                  value={formatNumber(summary?.purchases || 0)}
                  subtitle="Compras registradas"
                  icon={ShoppingBag}
                  accentColor="#10B981"
                />
              )}

              {isVisible('roas') && (
                <MetricCard
                  title="ROAS"
                  value={(summary?.roas || 0) > 0 ? `${summary?.roas}x` : '0.00x'}
                  subtitle="Retorno sobre investimento"
                  icon={TrendingUp}
                  accentColor="#F59E0B"
                />
              )}

              {isVisible('ctr') && (
                <MetricCard
                  title="CTR"
                  value={formatPercent(summary?.ctr || 0)}
                  subtitle="Taxa de cliques / impressões"
                  icon={Percent}
                  accentColor="#38BDF8"
                />
              )}

              {isVisible('cpc') && (
                <MetricCard
                  title="CPC"
                  value={formatCurrency(summary?.cpc || 0)}
                  subtitle="Custo médio por clique"
                  icon={MousePointer}
                  accentColor="#00B4D8"
                />
              )}

              {isVisible('cpm') && (
                <MetricCard
                  title="CPM"
                  value={formatCurrency(summary?.cpm || 0)}
                  subtitle="Custo por mil impressões"
                  icon={CreditCard}
                  accentColor="#818CF8"
                />
              )}

              {isVisible('clicks') && (
                <MetricCard
                  title="Cliques"
                  value={formatNumber(summary?.clicks || 0)}
                  subtitle="Cliques no anúncio"
                  icon={TrendingUp}
                  accentColor="#0077B6"
                />
              )}

              {isVisible('impressions') && (
                <MetricCard
                  title="Impressões"
                  value={formatNumber(summary?.impressions || 0)}
                  subtitle="Exibições"
                  icon={Eye}
                  accentColor="#0284C7"
                />
              )}

              {isVisible('reach') && (
                <MetricCard
                  title="Alcance"
                  value={formatNumber(summary?.reach || 0)}
                  subtitle="Pessoas únicas alcançadas"
                  icon={Users}
                  accentColor="#38BDF8"
                />
              )}

              {isVisible('frequency') && (
                <MetricCard
                  title="Frequência"
                  value={summary?.frequency ? `${summary.frequency.toFixed(2)}x` : '1.00x'}
                  subtitle="Média de exibições por pessoa"
                  icon={Repeat}
                  accentColor="#A78BFA"
                />
              )}
            </div>

            {/* Charts with filtered metrics */}
            <PerformanceCharts
              campaigns={insights.campaigns}
              visibleMetrics={visibleMetrics}
            />

            {/* Campaigns Table with filtered columns */}
            <CampaignsTable
              campaigns={insights.campaigns}
              visibleMetrics={visibleMetrics}
            />
          </div>
        )}
      </main>
    </div>
  );
};

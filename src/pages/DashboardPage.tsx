import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  Target,
  Percent,
  MousePointer,
  Eye,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Building,
  Layers,
  Sliders,
  Wallet,
  Repeat,
  ShoppingBag,
  Megaphone,
  X,
  Filter,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { MetricCard } from '../components/MetricCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { CampaignsTable } from '../components/CampaignsTable';
import { AdSetsTable } from '../components/AdSetsTable';
import { AdsTable } from '../components/AdsTable';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { MetricsConfigModal } from '../components/MetricsConfigModal';
import type { CampaignInsight, AdSetInsight } from '../types/metaAds';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../lib/formatters';

interface DashboardPageProps {
  isAuthenticated: boolean;
  onNavigateToSettings: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  isAuthenticated,
  onNavigateToSettings,
}) => {
  const {
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
    refreshInsights,
    reloadClients,
  } = useDashboard(isAuthenticated);

  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignInsight | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<AdSetInsight | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<'campaigns' | 'adsets' | 'ads'>('campaigns');

  if (!loadingClients && clients.length === 0) {
    return (
      <EmptyState
        type="no-clients"
        actionText="Cadastrar Cliente"
        onAction={onNavigateToSettings}
      />
    );
  }

  if (!loadingAccounts && selectedClient && adAccounts.length === 0) {
    return (
      <EmptyState
        type="no-accounts"
        actionText="Vincular Conta Meta Ads"
        onAction={onNavigateToSettings}
      />
    );
  }

  const visibleMetrics: string[] =
    selectedClient?.visible_metrics ||
    insights?.visibleMetrics || [
      'balance', 'spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions', 'reach', 'frequency'
    ];

  const isVisible = (key: string) => visibleMetrics.includes(key);
  const accountSummary = insights?.summary;

  // Active Summary: If a campaign is selected, calculate metrics strictly for that campaign!
  const activeSummary = selectedCampaign
    ? {
        balance: accountSummary?.balance,
        spend: selectedCampaign.spend,
        leads: selectedCampaign.leads,
        cpl: selectedCampaign.cpl,
        clicks: selectedCampaign.clicks,
        impressions: selectedCampaign.impressions,
        reach: selectedCampaign.reach,
        frequency: selectedCampaign.frequency,
        ctr: selectedCampaign.ctr,
        cpc: selectedCampaign.cpc,
        cpm: selectedCampaign.cpm,
        roas: selectedCampaign.roas,
        purchases: selectedCampaign.purchases,
      }
    : accountSummary;

  // Filter Ad Sets and Ads based on selection
  const allAdSets = insights?.adsets || [];
  const filteredAdSets = selectedCampaign
    ? allAdSets.filter((a) => a.campaignId === selectedCampaign.campaignId)
    : allAdSets;

  const allAds = insights?.ads || [];
  const filteredAds = allAds.filter((ad) => {
    if (selectedAdSet) {
      return ad.adsetId === selectedAdSet.adsetId;
    }
    if (selectedCampaign) {
      return ad.campaignId === selectedCampaign.campaignId;
    }
    return true;
  });

  const handleSelectCampaign = (c: CampaignInsight | null) => {
    setSelectedCampaign(c);
    setSelectedAdSet(null);
    if (c) {
      // If user clicked a campaign, switch tab or keep visible
      if (activeTableTab === 'campaigns') {
        // stay or give option to view adsets
      }
    }
  };

  const handleSelectAdSet = (adset: AdSetInsight | null) => {
    setSelectedAdSet(adset);
    if (adset) {
      setActiveTableTab('ads');
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Control Bar: Client, Account, Share & Date Range Filter */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          {/* Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {/* Client Select */}
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Building size={14} color="#00A8E8" />
                <span className="form-label">Cliente</span>
              </div>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const client = clients.find((c) => c.id === e.target.value) || null;
                  setSelectedClient(client);
                  setSelectedCampaign(null);
                  setSelectedAdSet(null);
                }}
                className="form-select"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ad Account Select */}
            <div style={{ minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Layers size={14} color="#00B4D8" />
                <span className="form-label">Conta de Anúncios</span>
              </div>
              <select
                value={selectedAccount?.id || ''}
                onChange={(e) => {
                  const acc = adAccounts.find((a) => a.id === e.target.value) || null;
                  setSelectedAccount(acc);
                  setSelectedCampaign(null);
                  setSelectedAdSet(null);
                }}
                className="form-select"
                disabled={adAccounts.length === 0}
              >
                {adAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.account_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics Customization & Share Button */}
            {selectedClient && (
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsMetricsModalOpen(true)}
                  className="btn-primary"
                  title="Configurar quais métricas aparecem, saldo da conta e link do cliente"
                  style={{
                    background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                    border: '1px solid rgba(0, 180, 216, 0.4)',
                    boxShadow: '0 4px 14px rgba(0, 180, 216, 0.3)',
                    padding: '9px 16px',
                  }}
                >
                  <Sliders size={15} />
                  Métricas, Saldo & Link
                </button>
              </div>
            )}
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setSelectedAdSet(null);
              refreshInsights();
            }}
            disabled={loadingInsights || !selectedAccount}
            className="btn-secondary"
            title="Atualizar dados em tempo real da Meta API"
          >
            <RefreshCw size={16} className={loadingInsights ? 'animate-spin' : ''} />
            {loadingInsights ? 'Consultando Meta API...' : 'Atualizar'}
          </button>
        </div>

        {/* Date Filter */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          <DateRangeFilter
            currentPreset={datePreset}
            currentRange={dateRange}
            onPresetChange={(p) => {
              setSelectedCampaign(null);
              setSelectedAdSet(null);
              handlePresetChange(p);
            }}
            onCustomRangeChange={(r) => {
              setSelectedCampaign(null);
              setSelectedAdSet(null);
              handleCustomDateChange(r);
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loadingInsights ? (
        <LoadingSkeleton />
      ) : error ? (
        <EmptyState
          type="error"
          errorDetails={error}
          actionText="Tentar novamente"
          onAction={() => refreshInsights()}
        />
      ) : !insights || (insights.campaigns.length === 0 && (!accountSummary || accountSummary.spend === 0)) ? (
        <EmptyState
          type="no-data"
          description="Nenhuma atividade ou veiculação de anúncios registrada para a conta neste período. Selecione um período maior ou verifique as campanhas ativas no Meta Ads Manager."
        />
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Active Campaign Filter Banner */}
          {selectedCampaign && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(0, 168, 232, 0.2) 0%, rgba(7, 18, 38, 0.6) 100%)',
              border: '1px solid #00E5FF',
              borderRadius: '12px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} color="#00E5FF" />
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#90E0EF', fontWeight: 700 }}>
                    Filtrando por Campanha
                  </span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: '1px' }}>
                    {selectedCampaign.campaignName}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setSelectedAdSet(null);
                }}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                }}
              >
                <X size={14} />
                Limpar Filtro (Ver Todas as Campanhas)
              </button>
            </div>
          )}

          {/* Indicator Cards (dynamically chosen by user & filtered when campaign is active) */}
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
                value={formatCurrency(activeSummary?.balance || 0)}
                subtitle={selectedCampaign ? 'Saldo da conta vinculada' : 'Saldo disponível / limite na Meta'}
                icon={Wallet}
                accentColor="#34D399"
              />
            )}

            {isVisible('spend') && (
              <MetricCard
                title="Investimento"
                value={formatCurrency(activeSummary?.spend || 0)}
                subtitle={selectedCampaign ? 'Investido nesta campanha' : 'Total investido no período'}
                icon={DollarSign}
                accentColor="#00A8E8"
              />
            )}

            {isVisible('leads') && (
              <MetricCard
                title="Leads"
                value={formatNumber(activeSummary?.leads || 0)}
                subtitle={selectedCampaign ? 'Leads desta campanha' : 'Conversões qualificadas'}
                icon={Users}
                accentColor="#10B981"
              />
            )}

            {isVisible('cpl') && (
              <MetricCard
                title="Custo por Lead"
                value={(activeSummary?.leads || 0) > 0 ? formatCurrency(activeSummary?.cpl || 0) : 'R$ 0,00'}
                subtitle={selectedCampaign ? 'CPL desta campanha' : 'CPL médio da conta'}
                icon={Target}
                accentColor="#F59E0B"
              />
            )}

            {isVisible('purchases') && (
              <MetricCard
                title="Vendas / Compras"
                value={formatNumber(activeSummary?.purchases || 0)}
                subtitle="Conversões de compra"
                icon={ShoppingBag}
                accentColor="#10B981"
              />
            )}

            {isVisible('roas') && (
              <MetricCard
                title="ROAS"
                value={(activeSummary?.roas || 0) > 0 ? `${activeSummary?.roas}x` : '0.00x'}
                subtitle="Retorno sobre investimento"
                icon={TrendingUp}
                accentColor="#F59E0B"
              />
            )}

            {isVisible('ctr') && (
              <MetricCard
                title="CTR"
                value={formatPercent(activeSummary?.ctr || 0)}
                subtitle="Taxa de cliques / impressões"
                icon={Percent}
                accentColor="#38BDF8"
              />
            )}

            {isVisible('cpc') && (
              <MetricCard
                title="CPC"
                value={formatCurrency(activeSummary?.cpc || 0)}
                subtitle="Custo médio por clique"
                icon={MousePointer}
                accentColor="#00B4D8"
              />
            )}

            {isVisible('cpm') && (
              <MetricCard
                title="CPM"
                value={formatCurrency(activeSummary?.cpm || 0)}
                subtitle="Custo por mil impressões"
                icon={CreditCard}
                accentColor="#818CF8"
              />
            )}

            {isVisible('clicks') && (
              <MetricCard
                title="Cliques"
                value={formatNumber(activeSummary?.clicks || 0)}
                subtitle="Cliques no link / anúncio"
                icon={TrendingUp}
                accentColor="#0077B6"
              />
            )}

            {isVisible('impressions') && (
              <MetricCard
                title="Impressões"
                value={formatNumber(activeSummary?.impressions || 0)}
                subtitle="Exibições de anúncios"
                icon={Eye}
                accentColor="#0284C7"
              />
            )}

            {isVisible('reach') && (
              <MetricCard
                title="Alcance"
                value={formatNumber(activeSummary?.reach || 0)}
                subtitle="Pessoas únicas alcançadas"
                icon={Users}
                accentColor="#38BDF8"
              />
            )}

            {isVisible('frequency') && (
              <MetricCard
                title="Frequência"
                value={activeSummary?.frequency ? `${activeSummary.frequency.toFixed(2)}x` : '1.00x'}
                subtitle="Média de exibições por pessoa"
                icon={Repeat}
                accentColor="#A78BFA"
              />
            )}
          </div>

          {/* Performance Comparative Charts (Bar, Columns, Pie/Donut) */}
          <PerformanceCharts
            campaigns={insights.campaigns}
            visibleMetrics={visibleMetrics}
            selectedCampaignId={selectedCampaign?.campaignId}
            onSelectCampaign={handleSelectCampaign}
          />

          {/* Drill-down Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setActiveTableTab('campaigns')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTableTab === 'campaigns' ? 'rgba(0, 168, 232, 0.2)' : 'transparent',
                border: activeTableTab === 'campaigns' ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTableTab === 'campaigns' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <Building size={16} color={activeTableTab === 'campaigns' ? '#00E5FF' : '#64748B'} />
              Campanhas ({insights.campaigns.length})
            </button>

            <button
              onClick={() => setActiveTableTab('adsets')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTableTab === 'adsets' ? 'rgba(0, 168, 232, 0.2)' : 'transparent',
                border: activeTableTab === 'adsets' ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTableTab === 'adsets' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <Layers size={16} color={activeTableTab === 'adsets' ? '#00E5FF' : '#64748B'} />
              Conjuntos de Anúncios ({filteredAdSets.length})
              {selectedCampaign && (
                <span style={{ fontSize: '0.7rem', color: '#00E5FF', marginLeft: '4px' }}>
                  (filtrado)
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTableTab('ads')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTableTab === 'ads' ? 'rgba(0, 168, 232, 0.2)' : 'transparent',
                border: activeTableTab === 'ads' ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTableTab === 'ads' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <Megaphone size={16} color={activeTableTab === 'ads' ? '#00E5FF' : '#64748B'} />
              Anúncios Individuais ({filteredAds.length})
              {(selectedCampaign || selectedAdSet) && (
                <span style={{ fontSize: '0.7rem', color: '#00E5FF', marginLeft: '4px' }}>
                  (filtrado)
                </span>
              )}
            </button>
          </div>

          {/* Drill-Down Tables Display */}
          {activeTableTab === 'campaigns' && (
            <CampaignsTable
              campaigns={insights.campaigns}
              visibleMetrics={visibleMetrics}
              selectedCampaignId={selectedCampaign?.campaignId}
              onSelectCampaign={handleSelectCampaign}
            />
          )}

          {activeTableTab === 'adsets' && (
            <AdSetsTable
              adsets={filteredAdSets}
              selectedCampaignName={selectedCampaign?.campaignName}
              selectedAdSetId={selectedAdSet?.adsetId}
              onSelectAdSet={handleSelectAdSet}
              onClearCampaignFilter={() => setSelectedCampaign(null)}
              visibleMetrics={visibleMetrics}
            />
          )}

          {activeTableTab === 'ads' && (
            <AdsTable
              ads={filteredAds}
              selectedCampaignName={selectedCampaign?.campaignName}
              selectedAdSetName={selectedAdSet?.adsetName}
              onClearAdSetFilter={() => setSelectedAdSet(null)}
              visibleMetrics={visibleMetrics}
            />
          )}
        </div>
      )}

      {/* Metrics & Share Link Configuration Modal */}
      {selectedClient && (
        <MetricsConfigModal
          client={selectedClient}
          adAccount={selectedAccount}
          isOpen={isMetricsModalOpen}
          onClose={() => setIsMetricsModalOpen(false)}
          onUpdated={(updatedMetrics) => {
            selectedClient.visible_metrics = updatedMetrics;
            reloadClients();
          }}
        />
      )}
    </div>
  );
};

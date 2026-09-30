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
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { MetricCard } from '../components/MetricCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { CampaignsTable } from '../components/CampaignsTable';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { MetricsConfigModal } from '../components/MetricsConfigModal';
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
  const summary = insights?.summary;

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
            onClick={() => refreshInsights()}
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
            onPresetChange={handlePresetChange}
            onCustomRangeChange={handleCustomDateChange}
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
      ) : !insights || (insights.campaigns.length === 0 && (!summary || summary.spend === 0)) ? (
        <EmptyState
          type="no-data"
          description="Nenhuma atividade ou veiculação de anúncios registrada para a conta neste período. Selecione um período maior ou verifique as campanhas ativas no Meta Ads Manager."
        />
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Indicator Cards (dynamically chosen by user) */}
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
                subtitle="Conversões qualificadas"
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
                title="Vendas / Compras"
                value={formatNumber(summary?.purchases || 0)}
                subtitle="Conversões de compra"
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
                subtitle="Cliques no link / anúncio"
                icon={TrendingUp}
                accentColor="#0077B6"
              />
            )}

            {isVisible('impressions') && (
              <MetricCard
                title="Impressões"
                value={formatNumber(summary?.impressions || 0)}
                subtitle="Exibições de anúncios"
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

          {/* Performance Comparative Charts */}
          <PerformanceCharts
            campaigns={insights.campaigns}
            visibleMetrics={visibleMetrics}
          />

          {/* Campaigns Data Table */}
          <CampaignsTable
            campaigns={insights.campaigns}
            visibleMetrics={visibleMetrics}
          />
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

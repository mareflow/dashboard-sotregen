import React, { useState } from 'react';
import {
  X,
  Check,
  Sliders,
  Copy,
  CheckCheck,
  Wallet,
  Zap,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { ALL_METRICS } from '../types/metaAds';
import type { MetricKey } from '../types/metaAds';
import {
  updateClientMetrics,
  toggleClientShare,
  updateAdAccountBalance,
} from '../services/clientService';
import type { Client, MetaAdAccount } from '../types/database';

interface MetricsConfigModalProps {
  client: Client;
  adAccount?: MetaAdAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedMetrics: string[]) => void;
}

export const MetricsConfigModal: React.FC<MetricsConfigModalProps> = ({
  client,
  adAccount,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    client.visible_metrics || ALL_METRICS.map((m) => m.key)
  );
  const [shareEnabled, setShareEnabled] = useState<boolean>(client.share_enabled !== false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Balance Configuration
  const [balanceType, setBalanceType] = useState<'auto' | 'manual'>(
    adAccount?.balance_type || 'auto'
  );
  const [manualBalance, setManualBalance] = useState<string>(
    adAccount?.manual_balance !== undefined && adAccount?.manual_balance !== null
      ? String(adAccount.manual_balance)
      : ''
  );
  const [monthlyBudget, setMonthlyBudget] = useState<string>(
    adAccount?.monthly_budget !== undefined && adAccount?.monthly_budget !== null
      ? String(adAccount.monthly_budget)
      : ''
  );

  if (!isOpen) return null;

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const applyPreset = (preset: 'all' | 'leads' | 'ecommerce') => {
    if (preset === 'all') {
      setSelectedMetrics(ALL_METRICS.map((m) => m.key));
    } else if (preset === 'leads') {
      setSelectedMetrics(['balance', 'spend', 'leads', 'cpl', 'ctr', 'clicks', 'reach']);
    } else if (preset === 'ecommerce') {
      setSelectedMetrics(['balance', 'spend', 'purchases', 'roas', 'cpc', 'cpm', 'ctr', 'clicks']);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClientMetrics(client.id, selectedMetrics);
      if (shareEnabled !== client.share_enabled) {
        await toggleClientShare(client.id, shareEnabled);
      }

      // Save balance settings if adAccount is present
      if (adAccount) {
        const numBalance = manualBalance.trim() ? parseFloat(manualBalance.replace(',', '.')) : null;
        const numBudget = monthlyBudget.trim() ? parseFloat(monthlyBudget.replace(',', '.')) : null;
        await updateAdAccountBalance(adAccount.id, balanceType, numBalance, numBudget);
        adAccount.balance_type = balanceType;
        adAccount.manual_balance = numBalance;
        adAccount.monthly_budget = numBudget;
      }

      onUpdated(selectedMetrics);
      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = `${window.location.origin}/?token=${client.share_token}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copie o link abaixo:', shareUrl);
    }
  };

  const financeMetrics = ALL_METRICS.filter((m) => m.category === 'finance');
  const conversionMetrics = ALL_METRICS.filter((m) => m.category === 'conversion');
  const performanceMetrics = ALL_METRICS.filter((m) => m.category === 'performance');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(4, 9, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '28px',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 168, 232, 0.2)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00A8E8, #002B5C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 168, 232, 0.3)',
            }}>
              <Sliders size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                Personalizar Métricas & Saldo
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                Cliente: <strong style={{ color: '#00B4D8' }}>{client.name}</strong>
                {adAccount && <span> • Conta: <strong style={{ color: '#E2E8F0' }}>{adAccount.account_name}</strong></span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. Account Balance Configuration Section */}
        <div style={{
          background: 'rgba(7, 18, 38, 0.7)',
          border: '1px solid rgba(0, 168, 232, 0.25)',
          borderRadius: '10px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#00A8E8" />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>
              Controle de Saldo da Conta
            </h4>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="radio"
                name="balanceType"
                checked={balanceType === 'auto'}
                onChange={() => setBalanceType('auto')}
              />
              <span style={{ color: balanceType === 'auto' ? '#FFFFFF' : '#94A3B8' }}>
                Automático via Meta API (Saldo pré-pago ou limite restante)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="radio"
                name="balanceType"
                checked={balanceType === 'manual'}
                onChange={() => setBalanceType('manual')}
              />
              <span style={{ color: balanceType === 'manual' ? '#FFFFFF' : '#94A3B8' }}>
                Definir Saldo Manual (R$)
              </span>
            </label>
          </div>

          {balanceType === 'manual' && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Saldo Restante (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={manualBalance}
                  onChange={(e) => setManualBalance(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Orçamento Mensal Contratado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5000.00"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Presets Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            {selectedMetrics.length} métricas selecionadas para exibição
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => applyPreset('leads')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Zap size={13} color="#10B981" />
              Foco em Leads
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ecommerce')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <ShoppingBag size={13} color="#F59E0B" />
              E-commerce / ROAS
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <TrendingUp size={13} color="#00A8E8" />
              Todas
            </button>
          </div>
        </div>

        {/* 3. Metric Selection Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Finance Category */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
              Financeiro & Saldo
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {financeMetrics.map((metric) => {
                const isChecked = selectedMetrics.includes(metric.key);
                return (
                  <div
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(0, 168, 232, 0.14)' : 'rgba(7, 18, 38, 0.5)',
                      border: isChecked ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: isChecked ? '#00A8E8' : 'transparent',
                      border: isChecked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#FFFFFF' : '#94A3B8' }}>
                      {metric.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversion Category */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#34D399', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
              Conversão & Resultados
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {conversionMetrics.map((metric) => {
                const isChecked = selectedMetrics.includes(metric.key);
                return (
                  <div
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(16, 185, 129, 0.14)' : 'rgba(7, 18, 38, 0.5)',
                      border: isChecked ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: isChecked ? '#10B981' : 'transparent',
                      border: isChecked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#FFFFFF' : '#94A3B8' }}>
                      {metric.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Category */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#A78BFA', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
              Entrega & Desempenho
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {performanceMetrics.map((metric) => {
                const isChecked = selectedMetrics.includes(metric.key);
                return (
                  <div
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(167, 139, 250, 0.14)' : 'rgba(7, 18, 38, 0.5)',
                      border: isChecked ? '1px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: isChecked ? '#8B5CF6' : 'transparent',
                      border: isChecked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#FFFFFF' : '#94A3B8' }}>
                      {metric.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Client Share Link Section */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'rgba(7, 18, 38, 0.85)',
          border: '1px solid rgba(0, 168, 232, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF' }}>
              Link de Acesso do Cliente
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shareEnabled}
                onChange={(e) => setShareEnabled(e.target.checked)}
              />
              Link Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="form-input"
              style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#38BDF8' }}
            />
            <button
              type="button"
              onClick={copyShareLink}
              className="btn-primary"
              style={{ flexShrink: 0, padding: '0 14px', fontSize: '0.75rem' }}
            >
              {copied ? (
                <>
                  <CheckCheck size={14} color="#6EE7B7" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '8px 20px' }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

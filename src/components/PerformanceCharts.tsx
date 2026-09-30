import React, { useState, useEffect } from 'react';
import type { CampaignInsight } from '../types/metaAds';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { DollarSign, Target, TrendingUp } from 'lucide-react';

interface PerformanceChartsProps {
  campaigns: CampaignInsight[];
  visibleMetrics?: string[];
}

type ChartView = 'spend' | 'leads' | 'cpl';

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  campaigns,
  visibleMetrics = ['spend', 'leads', 'cpl'],
}) => {
  const isSpendVisible = visibleMetrics.includes('spend');
  const isLeadsVisible = visibleMetrics.includes('leads');
  const isCplVisible = visibleMetrics.includes('cpl');

  // Choose first available metric as initial active metric
  const defaultMetric: ChartView = isSpendVisible
    ? 'spend'
    : isLeadsVisible
    ? 'leads'
    : 'cpl';

  const [activeMetric, setActiveMetric] = useState<ChartView>(defaultMetric);

  useEffect(() => {
    if (activeMetric === 'spend' && !isSpendVisible) {
      if (isLeadsVisible) setActiveMetric('leads');
      else if (isCplVisible) setActiveMetric('cpl');
    }
  }, [isSpendVisible, isLeadsVisible, isCplVisible, activeMetric]);

  if (campaigns.length === 0 || (!isSpendVisible && !isLeadsVisible && !isCplVisible)) {
    return null;
  }

  const sortedCampaigns = [...campaigns]
    .sort((a, b) => {
      if (activeMetric === 'spend') return b.spend - a.spend;
      if (activeMetric === 'leads') return b.leads - a.leads;
      if (activeMetric === 'cpl') {
        if (a.leads === 0 && b.leads === 0) return 0;
        if (a.leads === 0) return 1;
        if (b.leads === 0) return -1;
        return a.cpl - b.cpl;
      }
      return 0;
    })
    .slice(0, 6);

  const maxValue = Math.max(
    ...sortedCampaigns.map((c) => {
      if (activeMetric === 'spend') return c.spend;
      if (activeMetric === 'leads') return c.leads;
      return c.cpl;
    }),
    1
  );

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
            Comparativo de Desempenho
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            Visualização rápida das principais campanhas no período
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {isSpendVisible && (
            <button
              onClick={() => setActiveMetric('spend')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeMetric === 'spend' ? 'rgba(0, 168, 232, 0.25)' : 'rgba(12, 26, 54, 0.6)',
                border: activeMetric === 'spend' ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeMetric === 'spend' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              <DollarSign size={14} color="#00A8E8" />
              Investimento
            </button>
          )}

          {isLeadsVisible && (
            <button
              onClick={() => setActiveMetric('leads')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeMetric === 'leads' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(12, 26, 54, 0.6)',
                border: activeMetric === 'leads' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeMetric === 'leads' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              <Target size={14} color="#10B981" />
              Leads Gerados
            </button>
          )}

          {isCplVisible && (
            <button
              onClick={() => setActiveMetric('cpl')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeMetric === 'cpl' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(12, 26, 54, 0.6)',
                border: activeMetric === 'cpl' ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeMetric === 'cpl' ? '#FFFFFF' : '#94A3B8',
              }}
            >
              <TrendingUp size={14} color="#F59E0B" />
              CPL (Menor Custo)
            </button>
          )}
        </div>
      </div>

      {/* Bar Chart Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sortedCampaigns.map((camp) => {
          let metricValueStr = '';
          let barPercentage = 0;
          let barColor = '#00A8E8';

          if (activeMetric === 'spend') {
            metricValueStr = formatCurrency(camp.spend);
            barPercentage = (camp.spend / maxValue) * 100;
            barColor = 'linear-gradient(90deg, #00A8E8, #0077B6)';
          } else if (activeMetric === 'leads') {
            metricValueStr = `${formatNumber(camp.leads)} leads`;
            barPercentage = (camp.leads / maxValue) * 100;
            barColor = 'linear-gradient(90deg, #10B981, #059669)';
          } else {
            metricValueStr = camp.leads > 0 ? formatCurrency(camp.cpl) : 'Sem leads';
            barPercentage = camp.leads > 0 ? (camp.cpl / maxValue) * 100 : 0;
            barColor = 'linear-gradient(90deg, #F59E0B, #D97706)';
          }

          return (
            <div key={camp.campaignId} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#E2E8F0', fontWeight: 600, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {camp.campaignName}
                </span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  {metricValueStr}
                </span>
              </div>

              {/* Progress Track */}
              <div style={{
                height: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(2, barPercentage))}%`,
                    background: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

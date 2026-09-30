import React, { useState, useEffect } from 'react';
import type { CampaignInsight } from '../types/metaAds';
import { formatCurrency, formatNumber, formatPercent } from '../lib/formatters';
import { BarChart3, PieChart as PieIcon, AlignLeft } from 'lucide-react';

interface PerformanceChartsProps {
  campaigns: CampaignInsight[];
  visibleMetrics?: string[];
  selectedCampaignId?: string | null;
  onSelectCampaign?: (campaign: CampaignInsight | null) => void;
}

type ChartType = 'columns' | 'pie' | 'bars';
type MetricChoice = 'spend' | 'leads' | 'clicks' | 'cpl';

const PIE_COLORS = [
  '#00E5FF', // Neon Cyan
  '#00A8E8', // Ocean Blue
  '#38BDF8', // Sky Blue
  '#818CF8', // Indigo
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
];

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  campaigns,
  visibleMetrics = ['spend', 'leads', 'clicks', 'cpl'],
  selectedCampaignId,
  onSelectCampaign,
}) => {
  const isSpendVisible = visibleMetrics.includes('spend');
  const isLeadsVisible = visibleMetrics.includes('leads');
  const isClicksVisible = visibleMetrics.includes('clicks');
  const isCplVisible = visibleMetrics.includes('cpl');

  const [chartType, setChartType] = useState<ChartType>('columns');
  const [activeMetric, setActiveMetric] = useState<MetricChoice>(
    isSpendVisible ? 'spend' : isLeadsVisible ? 'leads' : 'clicks'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeMetric === 'spend' && !isSpendVisible) {
      if (isLeadsVisible) setActiveMetric('leads');
      else if (isClicksVisible) setActiveMetric('clicks');
    }
  }, [isSpendVisible, isLeadsVisible, isClicksVisible, activeMetric]);

  if (campaigns.length === 0 || (!isSpendVisible && !isLeadsVisible && !isClicksVisible && !isCplVisible)) {
    return null;
  }

  // Sort campaigns according to active metric
  const sortedCampaigns = [...campaigns]
    .sort((a, b) => {
      if (activeMetric === 'spend') return b.spend - a.spend;
      if (activeMetric === 'leads') return b.leads - a.leads;
      if (activeMetric === 'clicks') return b.clicks - a.clicks;
      if (activeMetric === 'cpl') {
        if (a.leads === 0 && b.leads === 0) return 0;
        if (a.leads === 0) return 1;
        if (b.leads === 0) return -1;
        return a.cpl - b.cpl;
      }
      return 0;
    })
    .slice(0, 8); // Top 8 campaigns for clear visualization

  const getMetricValue = (c: CampaignInsight): number => {
    if (activeMetric === 'spend') return c.spend;
    if (activeMetric === 'leads') return c.leads;
    if (activeMetric === 'clicks') return c.clicks;
    return c.cpl;
  };

  const getFormattedValue = (val: number): string => {
    if (activeMetric === 'spend' || activeMetric === 'cpl') return formatCurrency(val);
    return formatNumber(val);
  };

  const getMetricLabel = (): string => {
    switch (activeMetric) {
      case 'spend': return 'Investimento (R$)';
      case 'leads': return 'Leads Gerados';
      case 'clicks': return 'Cliques no Link';
      case 'cpl': return 'Custo por Lead (CPL)';
      default: return '';
    }
  };

  const totalValue = sortedCampaigns.reduce((acc, c) => acc + getMetricValue(c), 0);
  const maxValue = Math.max(...sortedCampaigns.map(getMetricValue), 1);

  // SVG Donut calculation
  let cumulativeAngle = 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const donutSlices = sortedCampaigns.map((c, index) => {
    const val = getMetricValue(c);
    const percentage = totalValue > 0 ? (val / totalValue) : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;
    const color = PIE_COLORS[index % PIE_COLORS.length];

    return {
      campaign: c,
      val,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
      {/* Header with Title and Mode Switchers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              Inteligência Visual & Gráficos
            </h3>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(0, 168, 232, 0.15)',
              color: '#00E5FF',
              border: '1px solid rgba(0, 168, 232, 0.3)',
            }}>
              {getMetricLabel()}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            Comparativo dinâmico das principais campanhas • Alterne o formato e a métrica abaixo
          </p>
        </div>

        {/* Controls: Chart Type & Metric Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Chart Type Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(7, 18, 38, 0.7)',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={() => setChartType('columns')}
              title="Gráfico de Colunas"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: chartType === 'columns' ? 'rgba(0, 168, 232, 0.3)' : 'transparent',
                border: 'none',
                color: chartType === 'columns' ? '#00E5FF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <BarChart3 size={15} />
              Colunas
            </button>

            <button
              onClick={() => setChartType('pie')}
              title="Gráfico de Pizza / Donut"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: chartType === 'pie' ? 'rgba(0, 168, 232, 0.3)' : 'transparent',
                border: 'none',
                color: chartType === 'pie' ? '#00E5FF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <PieIcon size={15} />
              Pizza (Share)
            </button>

            <button
              onClick={() => setChartType('bars')}
              title="Gráfico de Barras Horizontais"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: chartType === 'bars' ? 'rgba(0, 168, 232, 0.3)' : 'transparent',
                border: 'none',
                color: chartType === 'bars' ? '#00E5FF' : '#94A3B8',
                transition: 'all 0.2s',
              }}
            >
              <AlignLeft size={15} />
              Ranking
            </button>
          </div>

          {/* Metric Selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {isSpendVisible && (
              <button
                onClick={() => setActiveMetric('spend')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMetric === 'spend' ? 'rgba(0, 168, 232, 0.25)' : 'rgba(12, 26, 54, 0.5)',
                  border: activeMetric === 'spend' ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeMetric === 'spend' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                Investimento
              </button>
            )}

            {isLeadsVisible && (
              <button
                onClick={() => setActiveMetric('leads')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMetric === 'leads' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(12, 26, 54, 0.5)',
                  border: activeMetric === 'leads' ? '1px solid #4ADE80' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeMetric === 'leads' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                Leads
              </button>
            )}

            {isClicksVisible && (
              <button
                onClick={() => setActiveMetric('clicks')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMetric === 'clicks' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(12, 26, 54, 0.5)',
                  border: activeMetric === 'clicks' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeMetric === 'clicks' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                Cliques
              </button>
            )}

            {isCplVisible && (
              <button
                onClick={() => setActiveMetric('cpl')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeMetric === 'cpl' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(12, 26, 54, 0.5)',
                  border: activeMetric === 'cpl' ? '1px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeMetric === 'cpl' ? '#FFFFFF' : '#94A3B8',
                }}
              >
                CPL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. VISUALIZAÇÃO: COLUNAS VERTICAIS */}
      {chartType === 'columns' && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '14px',
          height: '240px',
          padding: '20px 10px 10px',
          background: 'rgba(7, 18, 38, 0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          position: 'relative',
        }}>
          {sortedCampaigns.map((campaign, idx) => {
            const val = getMetricValue(campaign);
            const heightPercent = maxValue > 0 ? Math.max((val / maxValue) * 100, 6) : 6;
            const isHovered = hoveredIndex === idx;
            const isSelected = selectedCampaignId === campaign.campaignId;
            const color = PIE_COLORS[idx % PIE_COLORS.length];

            return (
              <div
                key={campaign.campaignId}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectCampaign && onSelectCampaign(isSelected ? null : campaign)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: `calc(${heightPercent}% + 12px)`,
                    background: 'rgba(10, 25, 47, 0.95)',
                    border: `1px solid ${color}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px ${color}40`,
                    pointerEvents: 'none',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                      {campaign.campaignName}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, color: color }}>
                      {getFormattedValue(val)}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                      Clique para filtrar campanha
                    </p>
                  </div>
                )}

                {/* Value at the top of the column */}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: isHovered || isSelected ? '#FFFFFF' : '#94A3B8',
                  marginBottom: '6px',
                  transition: 'color 0.2s',
                }}>
                  {getFormattedValue(val)}
                </span>

                {/* The Column Bar */}
                <div style={{
                  width: '100%',
                  maxWidth: '52px',
                  height: `${heightPercent}%`,
                  borderRadius: '8px 8px 3px 3px',
                  background: isSelected
                    ? `linear-gradient(180deg, #FFFFFF 0%, ${color} 100%)`
                    : `linear-gradient(180deg, ${color} 0%, rgba(0, 43, 92, 0.8) 100%)`,
                  boxShadow: isHovered || isSelected ? `0 0 16px ${color}80` : 'none',
                  border: isSelected ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }} />

                {/* Campaign Label at bottom */}
                <span style={{
                  fontSize: '0.7rem',
                  color: isSelected ? '#00E5FF' : '#94A3B8',
                  fontWeight: isSelected ? 700 : 500,
                  marginTop: '8px',
                  textAlign: 'center',
                  maxWidth: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} title={campaign.campaignName}>
                  {campaign.campaignName}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VISUALIZAÇÃO: GRÁFICO DE PIZZA / DONUT (SHARE %) */}
      {chartType === 'pie' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '40px',
          padding: '20px 10px',
          background: 'rgba(7, 18, 38, 0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}>
          {/* Donut Chart SVG */}
          <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
              {donutSlices.map((slice, idx) => (
                <circle
                  key={slice.campaign.campaignId}
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={hoveredIndex === idx ? '28' : '22'}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    filter: hoveredIndex === idx ? `drop-shadow(0 0 8px ${slice.color})` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectCampaign && onSelectCampaign(slice.campaign)}
                />
              ))}
            </svg>

            {/* Center Label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <p style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {getFormattedValue(totalValue)}
              </p>
            </div>
          </div>

          {/* Legend and % Breakdown */}
          <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {donutSlices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx;
              const isSelected = selectedCampaignId === slice.campaign.campaignId;

              return (
                <div
                  key={slice.campaign.campaignId}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectCampaign && onSelectCampaign(isSelected ? null : slice.campaign)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isHovered || isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? `1px solid ${slice.color}` : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '60%' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: slice.color,
                      boxShadow: isHovered ? `0 0 8px ${slice.color}` : 'none',
                    }} />
                    <span style={{
                      fontSize: '0.8125rem',
                      color: isHovered ? '#FFFFFF' : '#CBD5E1',
                      fontWeight: isHovered ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }} title={slice.campaign.campaignName}>
                      {slice.campaign.campaignName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {getFormattedValue(slice.val)}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: slice.color,
                      minWidth: '45px',
                      textAlign: 'right',
                    }}>
                      {formatPercent(slice.percentage * 100)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VISUALIZAÇÃO: RANKING EM BARRAS HORIZONTAIS */}
      {chartType === 'bars' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedCampaigns.map((campaign, idx) => {
            const val = getMetricValue(campaign);
            const percentage = maxValue > 0 ? (val / maxValue) * 100 : 0;
            const isHovered = hoveredIndex === idx;
            const isSelected = selectedCampaignId === campaign.campaignId;
            const color = PIE_COLORS[idx % PIE_COLORS.length];

            return (
              <div
                key={campaign.campaignId}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectCampaign && onSelectCampaign(isSelected ? null : campaign)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(0, 168, 232, 0.12)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '75%' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>#{idx + 1}</span>
                    <span style={{
                      color: isSelected ? '#00E5FF' : isHovered ? '#FFFFFF' : '#CBD5E1',
                      fontWeight: isSelected ? 700 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {campaign.campaignName}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: color }}>
                    {getFormattedValue(val)}
                  </span>
                </div>

                <div style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, #002B5C 0%, ${color} 100%)`,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import type { AdSetInsight } from '../types/metaAds';
import { formatCurrency, formatNumber, formatPercent } from '../lib/formatters';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Layers, X } from 'lucide-react';

interface AdSetsTableProps {
  adsets: AdSetInsight[];
  selectedCampaignName?: string | null;
  selectedAdSetId?: string | null;
  onSelectAdSet?: (adset: AdSetInsight | null) => void;
  onClearCampaignFilter?: () => void;
  visibleMetrics?: string[];
}

type SortField = keyof AdSetInsight;
type SortDirection = 'asc' | 'desc';

export const AdSetsTable: React.FC<AdSetsTableProps> = ({
  adsets,
  selectedCampaignName,
  selectedAdSetId,
  onSelectAdSet,
  onClearCampaignFilter,
  visibleMetrics = [
    'spend', 'leads', 'cpl', 'ctr', 'cpc', 'clicks', 'impressions', 'reach', 'frequency'
  ],
}) => {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [search, setSearch] = useState('');

  const isVisible = (metricKey: string) => visibleMetrics.includes(metricKey);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedAdSets = useMemo(() => {
    return adsets
      .filter((a) =>
        a.adsetName.toLowerCase().includes(search.toLowerCase()) ||
        a.campaignName.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      });
  }, [adsets, search, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} color="#00A8E8" />
    ) : (
      <ArrowDown size={14} color="#00A8E8" />
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#00B4D8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              Conjuntos de Anúncios (Ad Sets)
            </h3>
            {selectedCampaignName && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(0, 168, 232, 0.2)',
                color: '#90E0EF',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 168, 232, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                Campanha: {selectedCampaignName}
                {onClearCampaignFilter && (
                  <button
                    onClick={onClearCampaignFilter}
                    style={{ background: 'transparent', border: 'none', color: '#90E0EF', cursor: 'pointer', padding: 0 }}
                    title="Remover filtro de campanha"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
            {adsets.length} {adsets.length === 1 ? 'conjunto de anúncios' : 'conjuntos de anúncios'} • Clique em uma linha para filtrar os anúncios
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            color="#64748B"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Buscar conjunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {adsets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
          <p>Nenhum conjunto de anúncios com veiculação no período selecionado.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th
                  onClick={() => handleSort('adsetName')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#94A3B8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none',
                    minWidth: '220px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Conjunto de Anúncios</span>
                    {renderSortIcon('adsetName')}
                  </div>
                </th>

                {!selectedCampaignName && (
                  <th
                    onClick={() => handleSort('campaignName')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                      minWidth: '180px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Campanha</span>
                      {renderSortIcon('campaignName')}
                    </div>
                  </th>
                )}

                {isVisible('spend') && (
                  <th
                    onClick={() => handleSort('spend')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>Investimento</span>
                      {renderSortIcon('spend')}
                    </div>
                  </th>
                )}

                {isVisible('leads') && (
                  <th
                    onClick={() => handleSort('leads')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>Leads</span>
                      {renderSortIcon('leads')}
                    </div>
                  </th>
                )}

                {isVisible('cpl') && (
                  <th
                    onClick={() => handleSort('cpl')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>CPL</span>
                      {renderSortIcon('cpl')}
                    </div>
                  </th>
                )}

                {isVisible('clicks') && (
                  <th
                    onClick={() => handleSort('clicks')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>Cliques</span>
                      {renderSortIcon('clicks')}
                    </div>
                  </th>
                )}

                {isVisible('ctr') && (
                  <th
                    onClick={() => handleSort('ctr')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>CTR</span>
                      {renderSortIcon('ctr')}
                    </div>
                  </th>
                )}

                {isVisible('cpc') && (
                  <th
                    onClick={() => handleSort('cpc')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>CPC</span>
                      {renderSortIcon('cpc')}
                    </div>
                  </th>
                )}

                {isVisible('impressions') && (
                  <th
                    onClick={() => handleSort('impressions')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>Impressões</span>
                      {renderSortIcon('impressions')}
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAdSets.map((adset) => {
                const isSelected = selectedAdSetId === adset.adsetId;
                return (
                  <tr
                    key={adset.adsetId}
                    onClick={() => onSelectAdSet && onSelectAdSet(isSelected ? null : adset)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: onSelectAdSet ? 'pointer' : 'default',
                      background: isSelected
                        ? 'rgba(0, 168, 232, 0.15)'
                        : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isSelected ? '#00E5FF' : '#00A8E8',
                          boxShadow: isSelected ? '0 0 8px #00E5FF' : 'none',
                        }} />
                        <span title={adset.adsetName}>{adset.adsetName}</span>
                      </div>
                    </td>

                    {!selectedCampaignName && (
                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {adset.campaignName || '-'}
                      </td>
                    )}

                    {isVisible('spend') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#38BDF8', fontWeight: 600 }}>
                        {formatCurrency(adset.spend)}
                      </td>
                    )}

                    {isVisible('leads') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#4ADE80', fontWeight: 700 }}>
                        {formatNumber(adset.leads)}
                      </td>
                    )}

                    {isVisible('cpl') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {adset.leads > 0 ? formatCurrency(adset.cpl) : '-'}
                      </td>
                    )}

                    {isVisible('clicks') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {formatNumber(adset.clicks)}
                      </td>
                    )}

                    {isVisible('ctr') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {formatPercent(adset.ctr)}
                      </td>
                    )}

                    {isVisible('cpc') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {adset.clicks > 0 ? formatCurrency(adset.cpc) : '-'}
                      </td>
                    )}

                    {isVisible('impressions') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                        {formatNumber(adset.impressions)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

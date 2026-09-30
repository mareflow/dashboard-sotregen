import React, { useState, useMemo } from 'react';
import type { AdInsight } from '../types/metaAds';
import { formatCurrency, formatNumber, formatPercent } from '../lib/formatters';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Megaphone, X } from 'lucide-react';

interface AdsTableProps {
  ads: AdInsight[];
  selectedCampaignName?: string | null;
  selectedAdSetName?: string | null;
  onClearAdSetFilter?: () => void;
  visibleMetrics?: string[];
}

type SortField = keyof AdInsight;
type SortDirection = 'asc' | 'desc';

export const AdsTable: React.FC<AdsTableProps> = ({
  ads,
  selectedCampaignName,
  selectedAdSetName,
  onClearAdSetFilter,
  visibleMetrics = [
    'spend', 'leads', 'cpl', 'ctr', 'cpc', 'clicks', 'impressions', 'reach'
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

  const filteredAndSortedAds = useMemo(() => {
    return ads
      .filter((a) =>
        a.adName.toLowerCase().includes(search.toLowerCase()) ||
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
  }, [ads, search, sortField, sortDirection]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Megaphone size={20} color="#38BDF8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              Anúncios Individuais (Criativos & Peças)
            </h3>

            {selectedCampaignName && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(0, 168, 232, 0.2)',
                color: '#90E0EF',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 168, 232, 0.4)',
              }}>
                Campanha: {selectedCampaignName}
              </span>
            )}

            {selectedAdSetName && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#BAE6FD',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                Conjunto: {selectedAdSetName}
                {onClearAdSetFilter && (
                  <button
                    onClick={onClearAdSetFilter}
                    style={{ background: 'transparent', border: 'none', color: '#BAE6FD', cursor: 'pointer', padding: 0 }}
                    title="Remover filtro de conjunto"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
            {ads.length} {ads.length === 1 ? 'anúncio veiculado' : 'anúncios veiculados'} no período
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
            placeholder="Buscar anúncio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
          <p>Nenhum anúncio com veiculação registrada no período.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th
                  onClick={() => handleSort('adName')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#94A3B8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none',
                    minWidth: '240px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Nome do Anúncio</span>
                    {renderSortIcon('adName')}
                  </div>
                </th>

                {!selectedAdSetName && (
                  <th
                    onClick={() => handleSort('adsetName')}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                      minWidth: '160px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Conjunto</span>
                      {renderSortIcon('adsetName')}
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
              {filteredAndSortedAds.map((ad) => {
                return (
                  <tr
                    key={ad.adId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#38BDF8',
                        }} />
                        <span title={ad.adName}>{ad.adName}</span>
                      </div>
                    </td>

                    {!selectedAdSetName && (
                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {ad.adsetName || '-'}
                      </td>
                    )}

                    {isVisible('spend') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#38BDF8', fontWeight: 600 }}>
                        {formatCurrency(ad.spend)}
                      </td>
                    )}

                    {isVisible('leads') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#4ADE80', fontWeight: 700 }}>
                        {formatNumber(ad.leads)}
                      </td>
                    )}

                    {isVisible('cpl') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {ad.leads > 0 ? formatCurrency(ad.cpl) : '-'}
                      </td>
                    )}

                    {isVisible('clicks') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {formatNumber(ad.clicks)}
                      </td>
                    )}

                    {isVisible('ctr') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {formatPercent(ad.ctr)}
                      </td>
                    )}

                    {isVisible('cpc') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#E2E8F0' }}>
                        {ad.clicks > 0 ? formatCurrency(ad.cpc) : '-'}
                      </td>
                    )}

                    {isVisible('impressions') && (
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                        {formatNumber(ad.impressions)}
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

import React, { useState, useMemo } from 'react';
import type { CampaignInsight } from '../types/metaAds';
import { formatCurrency, formatNumber, formatPercent } from '../lib/formatters';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface CampaignsTableProps {
  campaigns: CampaignInsight[];
  visibleMetrics?: string[];
}

type SortField = keyof CampaignInsight;
type SortDirection = 'asc' | 'desc';

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  visibleMetrics = [
    'spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions', 'reach', 'frequency'
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

  const filteredAndSortedCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => c.campaignName.toLowerCase().includes(search.toLowerCase()))
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
  }, [campaigns, search, sortField, sortDirection]);

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
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
            Desempenho por Campanha
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '2px' }}>
            {campaigns.length} {campaigns.length === 1 ? 'campanha encontrada' : 'campanhas encontradas'}
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
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid rgba(0, 168, 232, 0.15)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(7, 18, 38, 0.95)', borderBottom: '1px solid rgba(0, 168, 232, 0.2)' }}>
              <th
                onClick={() => handleSort('campaignName')}
                style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Campanha {renderSortIcon('campaignName')}
                </div>
              </th>

              {isVisible('spend') && (
                <th
                  onClick={() => handleSort('spend')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Investimento {renderSortIcon('spend')}
                  </div>
                </th>
              )}

              {isVisible('leads') && (
                <th
                  onClick={() => handleSort('leads')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Leads {renderSortIcon('leads')}
                  </div>
                </th>
              )}

              {isVisible('cpl') && (
                <th
                  onClick={() => handleSort('cpl')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    CPL {renderSortIcon('cpl')}
                  </div>
                </th>
              )}

              {isVisible('purchases') && (
                <th
                  onClick={() => handleSort('purchases')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Vendas {renderSortIcon('purchases')}
                  </div>
                </th>
              )}

              {isVisible('roas') && (
                <th
                  onClick={() => handleSort('roas')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    ROAS {renderSortIcon('roas')}
                  </div>
                </th>
              )}

              {isVisible('ctr') && (
                <th
                  onClick={() => handleSort('ctr')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    CTR {renderSortIcon('ctr')}
                  </div>
                </th>
              )}

              {isVisible('cpc') && (
                <th
                  onClick={() => handleSort('cpc')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    CPC {renderSortIcon('cpc')}
                  </div>
                </th>
              )}

              {isVisible('cpm') && (
                <th
                  onClick={() => handleSort('cpm')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    CPM {renderSortIcon('cpm')}
                  </div>
                </th>
              )}

              {isVisible('clicks') && (
                <th
                  onClick={() => handleSort('clicks')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Cliques {renderSortIcon('clicks')}
                  </div>
                </th>
              )}

              {isVisible('impressions') && (
                <th
                  onClick={() => handleSort('impressions')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Impressões {renderSortIcon('impressions')}
                  </div>
                </th>
              )}

              {isVisible('reach') && (
                <th
                  onClick={() => handleSort('reach')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Alcance {renderSortIcon('reach')}
                  </div>
                </th>
              )}

              {isVisible('frequency') && (
                <th
                  onClick={() => handleSort('frequency')}
                  style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Frequência {renderSortIcon('frequency')}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                  Nenhuma campanha encontrada correspondente à busca.
                </td>
              </tr>
            ) : (
              filteredAndSortedCampaigns.map((row, idx) => (
                <tr
                  key={row.campaignId || idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: idx % 2 === 0 ? 'rgba(12, 26, 54, 0.4)' : 'rgba(7, 18, 38, 0.2)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 168, 232, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(12, 26, 54, 0.4)' : 'rgba(7, 18, 38, 0.2)';
                  }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#FFFFFF', maxWidth: '280px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.campaignName}>
                      {row.campaignName}
                    </div>
                  </td>

                  {isVisible('spend') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#38BDF8' }}>
                      {formatCurrency(row.spend)}
                    </td>
                  )}

                  {isVisible('leads') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: row.leads > 0 ? '#34D399' : '#94A3B8' }}>
                      {formatNumber(row.leads)}
                    </td>
                  )}

                  {isVisible('cpl') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#CBD5E1' }}>
                      {row.leads > 0 ? formatCurrency(row.cpl) : '—'}
                    </td>
                  )}

                  {isVisible('purchases') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: (row.purchases || 0) > 0 ? '#34D399' : '#94A3B8' }}>
                      {formatNumber(row.purchases || 0)}
                    </td>
                  )}

                  {isVisible('roas') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: (row.roas || 0) > 0 ? '#F59E0B' : '#94A3B8' }}>
                      {(row.roas || 0) > 0 ? `${row.roas}x` : '—'}
                    </td>
                  )}

                  {isVisible('ctr') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#CBD5E1' }}>
                      {formatPercent(row.ctr)}
                    </td>
                  )}

                  {isVisible('cpc') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#CBD5E1' }}>
                      {formatCurrency(row.cpc)}
                    </td>
                  )}

                  {isVisible('cpm') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#CBD5E1' }}>
                      {formatCurrency(row.cpm)}
                    </td>
                  )}

                  {isVisible('clicks') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                      {formatNumber(row.clicks)}
                    </td>
                  )}

                  {isVisible('impressions') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                      {formatNumber(row.impressions)}
                    </td>
                  )}

                  {isVisible('reach') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                      {formatNumber(row.reach)}
                    </td>
                  )}

                  {isVisible('frequency') && (
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94A3B8' }}>
                      {row.frequency ? `${row.frequency.toFixed(2)}x` : '1.00x'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

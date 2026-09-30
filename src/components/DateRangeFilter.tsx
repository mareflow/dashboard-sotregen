import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { DatePreset, DateRange } from '../types/metaAds';
import { formatDateBR } from '../lib/formatters';

interface DateRangeFilterProps {
  currentPreset: DatePreset;
  currentRange: DateRange;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '14d', label: 'Últimos 14 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês anterior' },
  { id: 'custom', label: 'Personalizado' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  currentPreset,
  currentRange,
  onPresetChange,
  onCustomRangeChange,
}) => {
  const [showCustomInputs, setShowCustomInputs] = useState(currentPreset === 'custom');
  const [customSince, setCustomSince] = useState(currentRange.since);
  const [customUntil, setCustomUntil] = useState(currentRange.until);

  const handleSelectPreset = (preset: DatePreset) => {
    onPresetChange(preset);
    if (preset === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
    }
  };

  const applyCustomDates = () => {
    if (customSince && customUntil) {
      if (customSince > customUntil) {
        alert('A data inicial não pode ser maior que a data final.');
        return;
      }
      onCustomRangeChange({ since: customSince, until: customUntil });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        {PRESET_OPTIONS.map((opt) => {
          const isActive = currentPreset === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectPreset(opt.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                background: isActive ? 'rgba(0, 168, 232, 0.2)' : 'rgba(12, 26, 54, 0.6)',
                border: isActive ? '1px solid #00A8E8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {showCustomInputs && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(7, 18, 38, 0.95)',
            border: '1px solid rgba(0, 168, 232, 0.3)',
            marginTop: '4px',
          }}
        >
          <Calendar size={16} color="#00A8E8" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>De:</span>
            <input
              type="date"
              value={customSince}
              onChange={(e) => setCustomSince(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8125rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Até:</span>
            <input
              type="date"
              value={customUntil}
              onChange={(e) => setCustomUntil(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8125rem' }}
            />
          </div>
          <button
            onClick={applyCustomDates}
            className="btn-primary"
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
          >
            Aplicar
          </button>
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>Período selecionado:</span>
        <strong style={{ color: '#00B4D8' }}>
          {formatDateBR(currentRange.since)} até {formatDateBR(currentRange.until)}
        </strong>
      </div>
    </div>
  );
};

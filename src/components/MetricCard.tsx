import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = '#00A8E8',
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top indicator bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#94A3B8',
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: `rgba(${accentColor === '#00A8E8' ? '0, 168, 232' : '16, 185, 129'}, 0.12)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid rgba(${accentColor === '#00A8E8' ? '0, 168, 232' : '16, 185, 129'}, 0.25)`,
          }}
        >
          <Icon size={18} color={accentColor} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            lineHeight: 1.15,
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

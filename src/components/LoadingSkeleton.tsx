import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cards Skeleton Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel"
            style={{
              padding: '20px 22px',
              height: '118px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '40%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
            </div>
            <div style={{ width: '70%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }} />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          height: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'pulse 1.5s infinite ease-in-out',
        }}
      >
        <div style={{ width: '30%', height: '20px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
        <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
        <div style={{ width: '90%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
        <div style={{ width: '75%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
};

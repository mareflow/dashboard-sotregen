import React from 'react';
import { Waves, LayoutDashboard, Settings, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface NavbarProps {
  currentTab: 'dashboard' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'settings') => void;
  user: User | null;
  userRole?: 'admin' | 'coordenador' | 'gestor';
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  userRole = 'gestor',
  onSignOut,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid rgba(0, 168, 232, 0.2)',
      background: 'rgba(7, 18, 38, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00A8E8 0%, #002B5C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 168, 232, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <Waves size={24} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #FFFFFF 0%, #90E0EF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Maré Flow
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 168, 232, 0.15)',
                color: '#00B4D8',
                border: '1px solid rgba(0, 168, 232, 0.3)',
              }}>
                Meta Ads
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '-2px' }}>
              Dashboard de Inteligência de Tráfego
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onSelectTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: currentTab === 'dashboard' ? '1px solid rgba(0, 168, 232, 0.4)' : '1px solid transparent',
              background: currentTab === 'dashboard' ? 'rgba(0, 168, 232, 0.16)' : 'transparent',
              color: currentTab === 'dashboard' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            <LayoutDashboard size={18} color={currentTab === 'dashboard' ? '#00B4D8' : '#64748B'} />
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: currentTab === 'settings' ? '1px solid rgba(0, 168, 232, 0.4)' : '1px solid transparent',
              background: currentTab === 'settings' ? 'rgba(0, 168, 232, 0.16)' : 'transparent',
              color: currentTab === 'settings' ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            <Settings size={18} color={currentTab === 'settings' ? '#00B4D8' : '#64748B'} />
            Configurações
          </button>
        </nav>

        {/* User Account / Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Role Badge */}
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 8px',
                borderRadius: '6px',
                background: userRole === 'admin'
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(0, 168, 232, 0.25) 100%)'
                  : userRole === 'coordenador'
                  ? 'rgba(0, 168, 232, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
                color: userRole === 'admin'
                  ? '#C084FC'
                  : userRole === 'coordenador'
                  ? '#38BDF8'
                  : '#34D399',
                border: userRole === 'admin'
                  ? '1px solid rgba(168, 85, 247, 0.4)'
                  : userRole === 'coordenador'
                  ? '1px solid rgba(0, 168, 232, 0.4)'
                  : '1px solid rgba(16, 185, 129, 0.4)',
              }}>
                {userRole === 'admin' ? '👑 Admin' : userRole === 'coordenador' ? '🛡️ Coordenador' : '🚀 Gestor'}
              </span>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(12, 26, 54, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <UserIcon size={14} color="#00A8E8" />
                <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onSignOut}
            title="Sair da conta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#F87171',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

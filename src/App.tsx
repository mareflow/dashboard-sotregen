import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ClientPortalPage } from './pages/ClientPortalPage';

export function App() {
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Check URL query parameters for client share token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setShareToken(token);
    }
  }, []);

  const { user, role, loading, signIn, signUp, signOut, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  // 1. If accessing via client share token, render ClientPortalPage directly
  if (shareToken) {
    return <ClientPortalPage shareToken={shareToken} />;
  }

  // 2. Auth loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#040914',
      }}>
        <img
          src="/logo-sotregen.png"
          alt="Dashboard Sotregen"
          style={{
            height: '48px',
            width: 'auto',
            objectFit: 'contain',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 500 }}>
          Carregando Dashboard Sotregen...
        </span>
      </div>
    );
  }

  // 3. Not logged in -> Agency Login
  if (!isAuthenticated) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} />;
  }

  // 4. Authenticated Agency Workspace
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        userRole={role}
        onSignOut={signOut}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {currentTab === 'dashboard' ? (
          <DashboardPage
            key={dashboardRefreshKey}
            isAuthenticated={isAuthenticated}
            onNavigateToSettings={() => setCurrentTab('settings')}
          />
        ) : (
          <SettingsPage
            userRole={role}
            onRefreshDashboard={() => setDashboardRefreshKey((k) => k + 1)}
          />
        )}
      </main>
    </div>
  );
}

export default App;

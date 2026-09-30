import React, { useState } from 'react';
import { Waves, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onSignIn: (email: string, pass: string) => Promise<any>;
  onSignUp: (email: string, pass: string) => Promise<any>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignIn, onSignUp }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp(email, password);
        setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail ou faça login.');
        setIsSignUp(false);
      } else {
        await onSignIn(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else if (err.message?.includes('Password should be at least')) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMessage('Este e-mail já está cadastrado. Faça login.');
      } else {
        setErrorMessage(err.message || 'Erro ao processar autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #00A8E8 0%, #002B5C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(0, 168, 232, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        }}>
          <Waves size={30} color="#FFFFFF" strokeWidth={2.4} />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(90deg, #FFFFFF 0%, #90E0EF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '6px',
        }}>
          Maré Flow
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '28px', textAlign: 'center' }}>
          {isSignUp ? 'Crie sua conta para acessar o dashboard' : 'Faça login para gerenciar suas contas de anúncios'}
        </p>

        {errorMessage && (
          <div style={{
            width: '100%',
            padding: '10px 14px',
            marginBottom: '18px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FCA5A5',
            fontSize: '0.8125rem',
          }}>
            <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            width: '100%',
            padding: '10px 14px',
            marginBottom: '18px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6EE7B7',
            fontSize: '0.8125rem',
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px', height: '44px' }}
          >
            {loading ? (
              'Carregando...'
            ) : (
              <>
                {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00A8E8',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

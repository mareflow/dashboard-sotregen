import React from 'react';
import { AlertCircle, PlusCircle, RefreshCw, FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-clients' | 'no-accounts' | 'no-data' | 'error';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  errorDetails?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  errorDetails,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'no-clients':
        return <PlusCircle size={44} color="#00A8E8" />;
      case 'no-accounts':
        return <PlusCircle size={44} color="#00B4D8" />;
      case 'no-data':
        return <FolderSearch size={44} color="#94A3B8" />;
      case 'error':
        return <AlertCircle size={44} color="#EF4444" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'no-clients':
        return 'Nenhum cliente cadastrado';
      case 'no-accounts':
        return 'Nenhuma conta de anúncios vinculada';
      case 'no-data':
        return 'Não encontramos dados para este período';
      case 'error':
        return 'Não foi possível consultar a Meta Ads';
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case 'no-clients':
        return 'Cadastre seu primeiro cliente para começar a visualizar os dados de campanhas.';
      case 'no-accounts':
        return 'Adicione uma conta de anúncios do Meta Ads para este cliente na aba de Configurações.';
      case 'no-data':
        return 'Tente alterar o período selecionado para visualizar as métricas das campanhas.';
      case 'error':
        return 'Ocorreu um erro ao consultar os dados em tempo real. Tente novamente.';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '48px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        maxWidth: '560px',
        margin: '40px auto',
      }}
    >
      <div
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(0, 168, 232, 0.08)',
          border: '1px solid rgba(0, 168, 232, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getIcon()}
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
          {title || getDefaultTitle()}
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5 }}>
          {description || getDefaultDescription()}
        </p>
      </div>

      {errorDetails && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8125rem',
            color: '#FCA5A5',
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}
        >
          {errorDetails}
        </div>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className={type === 'error' ? 'btn-secondary' : 'btn-primary'}
          style={{ marginTop: '8px' }}
        >
          {type === 'error' && <RefreshCw size={16} />}
          {actionText || (type === 'error' ? 'Tentar novamente' : 'Configurar agora')}
        </button>
      )}
    </div>
  );
};

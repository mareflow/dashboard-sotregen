import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Building,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Copy,
  CheckCheck,
} from 'lucide-react';
import type { Client, MetaAdAccount } from '../types/database';
import {
  fetchClients,
  fetchAdAccounts,
  createClient,
  createAdAccount,
  deleteClient,
  deleteAdAccount,
} from '../services/clientService';
import { MetricsConfigModal } from '../components/MetricsConfigModal';

interface SettingsPageProps {
  onRefreshDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshDashboard }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Client
  const [newClientName, setNewClientName] = useState('');
  const [submittingClient, setSubmittingClient] = useState(false);

  // Form Ad Account
  const [selectedClientIdForAccount, setSelectedClientIdForAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [submittingAccount, setSubmittingAccount] = useState(false);

  // Modal State
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedClients, fetchedAccounts] = await Promise.all([
        fetchClients(),
        fetchAdAccounts(),
      ]);
      setClients(fetchedClients);
      setAdAccounts(fetchedAccounts);
      if (fetchedClients.length > 0 && !selectedClientIdForAccount) {
        setSelectedClientIdForAccount(fetchedClients[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar dados de configuração.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setSubmittingClient(true);
    setMessage(null);
    try {
      const created = await createClient(newClientName);
      setClients((prev) => [...prev, created]);
      setSelectedClientIdForAccount(created.id);
      setNewClientName('');
      setMessage({ type: 'success', text: `Cliente "${created.name}" cadastrado com sucesso!` });
      onRefreshDashboard();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar cliente.' });
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientIdForAccount || !newAccountId.trim()) return;

    setSubmittingAccount(true);
    setMessage(null);
    try {
      const created = await createAdAccount(
        selectedClientIdForAccount,
        newAccountName,
        newAccountId
      );
      setAdAccounts((prev) => [...prev, created]);
      setNewAccountName('');
      setNewAccountId('');
      setMessage({
        type: 'success',
        text: `Conta de anúncios "${created.account_name}" vinculada com sucesso!`,
      });
      onRefreshDashboard();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar conta de anúncios.' });
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}" e todas as suas contas vinculadas?`)) {
      return;
    }
    try {
      await deleteClient(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setAdAccounts((prev) => prev.filter((a) => a.client_id !== clientId));
      setMessage({ type: 'success', text: `Cliente "${clientName}" removido.` });
      onRefreshDashboard();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir cliente.' });
    }
  };

  const handleDeleteAccount = async (accountId: string, accountName: string | null) => {
    if (!confirm(`Deseja remover a conta "${accountName || accountId}"?`)) {
      return;
    }
    try {
      await deleteAdAccount(accountId);
      setAdAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setMessage({ type: 'success', text: 'Conta de anúncios removida.' });
      onRefreshDashboard();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir conta de anúncios.' });
    }
  };

  const copyClientLink = async (client: Client) => {
    const url = `${window.location.origin}/?token=${client.share_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedClientId(client.id);
      setTimeout(() => setCopiedClientId(null), 2500);
    } catch {
      prompt('Link do cliente:', url);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Title */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF' }}>
          Configuração de Clientes & Contas
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
          Gerencie clientes, contas de anúncios e controle exatamente quais métricas cada cliente pode ver.
        </p>
      </div>

      {/* Security Note Banner */}
      <div
        style={{
          background: 'rgba(0, 168, 232, 0.08)',
          border: '1px solid rgba(0, 168, 232, 0.3)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <ShieldCheck size={22} color="#00A8E8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
          <strong style={{ color: '#FFFFFF' }}>Segurança & Compartilhamento Seguro:</strong>
          <span style={{ color: '#CBD5E1', display: 'block', marginTop: '2px' }}>
            Cada cliente possui um link de visualização exclusivo. Ele só vê as métricas que a agência liberar no botão <strong>Métricas do Cliente</strong>, sem acesso a outras contas ou configurações.
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div
          className="animate-fade-in"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            color: message.type === 'success' ? '#6EE7B7' : '#FCA5A5',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Form 1: Add Client */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Building size={20} color="#00A8E8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              1. Adicionar Cliente
            </h3>
          </div>

          <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome do Cliente</label>
              <input
                type="text"
                required
                placeholder="Ex: Mecânica Tateno"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={submittingClient || !newClientName.trim()}
              className="btn-primary"
              style={{ marginTop: '4px' }}
            >
              <Plus size={16} />
              {submittingClient ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </form>
        </div>

        {/* Form 2: Add Meta Ad Account */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={20} color="#00B4D8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              2. Adicionar Conta Meta Ads
            </h3>
          </div>

          <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Vincular ao Cliente</label>
              <select
                value={selectedClientIdForAccount}
                onChange={(e) => setSelectedClientIdForAccount(e.target.value)}
                className="form-select"
                required
              >
                {clients.length === 0 ? (
                  <option value="">Nenhum cliente cadastrado</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nome da Conta (Apelido)</label>
              <input
                type="text"
                placeholder="Ex: Meta Ads Tateno"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account ID da Meta</label>
              <input
                type="text"
                required
                placeholder="Ex: act_1614544202842808"
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                className="form-input"
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                O ID pode conter ou não o prefixo "act_".
              </span>
            </div>

            <button
              type="submit"
              disabled={submittingAccount || clients.length === 0 || !newAccountId.trim()}
              className="btn-primary"
              style={{ marginTop: '4px' }}
            >
              <Plus size={16} />
              {submittingAccount ? 'Salvando...' : 'Vincular Conta Meta'}
            </button>
          </form>
        </div>
      </div>

      {/* Clients & Accounts Hierarchy List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
          Clientes, Métricas e Links de Acesso
        </h3>

        {loading ? (
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Carregando dados...</p>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
            Nenhum cliente cadastrado ainda. Use o formulário acima para adicionar o primeiro.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clients.map((client) => {
              const clientAccounts = adAccounts.filter((a) => a.client_id === client.id);
              const activeMetricsCount = client.visible_metrics?.length || 8;

              return (
                <div
                  key={client.id}
                  style={{
                    background: 'rgba(7, 18, 38, 0.6)',
                    border: '1px solid rgba(0, 168, 232, 0.15)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building size={18} color="#00A8E8" />
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {client.name}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0, 168, 232, 0.12)',
                        color: '#38BDF8',
                      }}>
                        {clientAccounts.length} {clientAccounts.length === 1 ? 'conta' : 'contas'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#34D399',
                      }}>
                        {activeMetricsCount} métricas ativas
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Customize metrics button */}
                      <button
                        type="button"
                        onClick={() => setModalClient(client)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Sliders size={14} color="#00B4D8" />
                        Métricas & Link
                      </button>

                      {/* Quick copy link */}
                      <button
                        type="button"
                        onClick={() => copyClientLink(client)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        {copiedClientId === client.id ? (
                          <>
                            <CheckCheck size={14} color="#6EE7B7" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copiar Link
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        className="btn-danger"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Ad accounts list */}
                  {clientAccounts.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', marginLeft: '28px' }}>
                      Nenhuma conta de anúncios vinculada a este cliente.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '28px' }}>
                      {clientAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(12, 26, 54, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Layers size={14} color="#00B4D8" />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E2E8F0' }}>
                              {acc.account_name || 'Conta Meta'}
                            </span>
                            <code style={{
                              fontSize: '0.75rem',
                              fontFamily: 'JetBrains Mono, monospace',
                              color: '#94A3B8',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              {acc.account_id}
                            </code>
                          </div>

                          <button
                            onClick={() => handleDeleteAccount(acc.id, acc.account_name)}
                            title="Remover conta"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#F87171',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Metrics Modal */}
      {modalClient && (
        <MetricsConfigModal
          client={modalClient}
          isOpen={!!modalClient}
          onClose={() => setModalClient(null)}
          onUpdated={(updatedMetrics) => {
            setClients((prev) =>
              prev.map((c) =>
                c.id === modalClient.id ? { ...c, visible_metrics: updatedMetrics } : c
              )
            );
            onRefreshDashboard();
          }}
        />
      )}
    </div>
  );
};

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
  fetchProfiles,
  updateUserRole,
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
} from '../services/clientService';
import { MetricsConfigModal } from '../components/MetricsConfigModal';
import { Users as TeamIcon, UserCheck, KeyRound, UserPlus, X } from 'lucide-react';

interface SettingsPageProps {
  userRole?: 'admin' | 'coordenador' | 'gestor';
  onRefreshDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  userRole = 'gestor',
  onRefreshDashboard,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Form Client
  const [newClientName, setNewClientName] = useState('');
  const [submittingClient, setSubmittingClient] = useState(false);

  // Form Ad Account
  const [selectedClientIdForAccount, setSelectedClientIdForAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountId, setNewAccountId] = useState('');
  const [submittingAccount, setSubmittingAccount] = useState(false);

  // Form New User (Admin only)
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'coordenador' | 'gestor'>('gestor');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Password reset modal/state
  const [editingPasswordUser, setEditingPasswordUser] = useState<{ id: string; email: string } | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Modal State
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises: [Promise<any>, Promise<any>, Promise<any>?] = [
        fetchClients(),
        fetchAdAccounts(),
      ];

      if (userRole === 'admin' || userRole === 'coordenador') {
        promises.push(fetchProfiles());
      }

      const results = await Promise.all(promises);
      const fetchedClients = results[0];
      const fetchedAccounts = results[1];
      const fetchedProfiles = results[2] || [];

      setClients(fetchedClients);
      setAdAccounts(fetchedAccounts);
      setProfiles(fetchedProfiles);

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
  }, [userRole]);

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'coordenador' | 'gestor') => {
    setUpdatingRoleId(userId);
    setMessage(null);
    try {
      await updateUserRole(userId, newRole);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setMessage({ type: 'success', text: `Nível de acesso atualizado para "${newRole}" com sucesso!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao alterar nível de acesso.' });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) return;
    setSubmittingUser(true);
    setMessage(null);
    try {
      await adminCreateUser(newUserEmail, newUserPassword, newUserRole, newUserFullName);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('gestor');
      setMessage({ type: 'success', text: `Novo usuário cadastrado com sucesso com o cargo de ${newUserRole}!` });
      const updatedProfiles = await fetchProfiles();
      setProfiles(updatedProfiles);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao cadastrar novo usuário.' });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${email}"? Esta ação removerá o acesso definitivamente.`)) {
      return;
    }
    setMessage(null);
    try {
      await adminDeleteUser(userId);
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setMessage({ type: 'success', text: `Usuário "${email}" excluído com sucesso!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser || !editPasswordValue || editPasswordValue.length < 6) return;
    setSubmittingPassword(true);
    setMessage(null);
    try {
      await adminUpdateUser(editingPasswordUser.id, undefined, editPasswordValue);
      setMessage({ type: 'success', text: `Senha de "${editingPasswordUser.email}" alterada com sucesso!` });
      setEditingPasswordUser(null);
      setEditPasswordValue('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao redefinir senha do usuário.' });
    } finally {
      setSubmittingPassword(false);
    }
  };

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

      {/* 4. Gestão de Equipe & Níveis de Acesso (Exclusivo Admin) */}
      {userRole === 'admin' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <TeamIcon size={20} color="#00E5FF" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FFFFFF' }}>
              Gestão de Equipe & Níveis de Acesso
            </h3>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(0, 168, 232, 0.25) 100%)',
              color: '#C084FC',
              border: '1px solid rgba(168, 85, 247, 0.4)',
            }}>
              👑 Painel do Administrador
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '20px' }}>
            Defina o papel de cada colaborador da agência. As alterações de permissão entram em vigor imediatamente.
          </p>

          {/* Explanation of Roles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#C084FC', marginBottom: '4px' }}>
                👑 Administrador (Admin)
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Acesso total e irrestrito a todas as contas, clientes, configurações globais e permissões da equipe.
              </p>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 168, 232, 0.08)',
              border: '1px solid rgba(0, 168, 232, 0.2)',
            }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                🛡️ Coordenador
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Visualiza e acompanha todas as contas de anúncios e clientes cadastrados por todos os gestores da agência.
              </p>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
                🚀 Gestor de Tráfego
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Cadastra e gerencia seus próprios clientes e contas de anúncios (visualiza exclusivamente os seus clientes).
              </p>
            </div>
          </div>

          {/* Form to Add New User */}
          <form
            onSubmit={handleCreateUser}
            style={{
              background: 'rgba(7, 18, 38, 0.6)',
              borderRadius: '10px',
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} color="#00E5FF" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                Cadastrar Novo Membro da Equipe
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              <div>
                <label className="form-label">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  placeholder="gestor@mareflow.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label className="form-label">Senha Inicial * (mínimo 6)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Senha de acesso..."
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label className="form-label">Nome do Colaborador</label>
                <input
                  type="text"
                  placeholder="Nome ou apelido"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label className="form-label">Nível de Acesso (Cargo)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="form-select"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <option value="gestor">🚀 Gestor de Tráfego</option>
                  <option value="coordenador">🛡️ Coordenador</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={submittingUser || !newUserEmail || !newUserPassword}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
              >
                <UserPlus size={15} />
                {submittingUser ? 'Criando usuário...' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>

          {/* Members Table */}
          {profiles.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Carregando membros da equipe...
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600 }}>Colaborador / E-mail</th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600 }}>Cargo Atual</th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600 }}>Alterar Nível</th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const isSelf = p.email === 'ia.mareflow@gmail.com';
                    const isUpdating = updatingRoleId === p.id;

                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                      >
                        <td style={{ padding: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCheck size={16} color="#00A8E8" />
                            <span>{p.email}</span>
                            {isSelf && (
                              <span style={{ fontSize: '0.65rem', color: '#00E5FF', background: 'rgba(0, 229, 255, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                Você
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            background: p.role === 'admin'
                              ? 'rgba(168, 85, 247, 0.2)'
                              : p.role === 'coordenador'
                              ? 'rgba(0, 168, 232, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                            color: p.role === 'admin'
                              ? '#C084FC'
                              : p.role === 'coordenador'
                              ? '#38BDF8'
                              : '#34D399',
                            border: p.role === 'admin'
                              ? '1px solid rgba(168, 85, 247, 0.35)'
                              : p.role === 'coordenador'
                              ? '1px solid rgba(0, 168, 232, 0.35)'
                              : '1px solid rgba(16, 185, 129, 0.35)',
                          }}>
                            {p.role === 'admin' ? '👑 Admin' : p.role === 'coordenador' ? '🛡️ Coordenador' : '🚀 Gestor'}
                          </span>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <select
                            value={p.role}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateRole(p.id, e.target.value as any)}
                            className="form-select"
                            style={{
                              width: 'auto',
                              display: 'inline-block',
                              padding: '5px 10px',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                            }}
                          >
                            <option value="admin">👑 Administrador</option>
                            <option value="coordenador">🛡️ Coordenador</option>
                            <option value="gestor">🚀 Gestor</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPasswordUser({ id: p.id, email: p.email });
                                setEditPasswordValue('');
                              }}
                              title="Redefinir senha do usuário"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38BDF8',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              <KeyRound size={13} />
                              Senha
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(p.id, p.email)}
                                title="Excluir colaborador"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#F87171',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Password Reset Modal */}
      {editingPasswordUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 9, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="#00E5FF" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Redefinir Senha
                </h4>
              </div>
              <button
                onClick={() => setEditingPasswordUser(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '16px' }}>
              Defina uma nova senha para <strong style={{ color: '#FFFFFF' }}>{editingPasswordUser.email}</strong>.
            </p>

            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nova Senha * (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Digite a nova senha..."
                  value={editPasswordValue}
                  onChange={(e) => setEditPasswordValue(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword || editPasswordValue.length < 6}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  {submittingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

import { supabase } from '../lib/supabaseClient';
import type { Client, MetaAdAccount } from '../types/database';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }

  return data || [];
}

export async function fetchAdAccounts(clientId?: string): Promise<MetaAdAccount[]> {
  let query = supabase
    .from('meta_ad_accounts')
    .select('*')
    .eq('active', true)
    .order('account_name', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar contas de anúncios: ${error.message}`);
  }

  return data || [];
}

export async function createClient(name: string, ownerId?: string): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        name: name.trim(),
        owner_id: ownerId || user.id,
        active: true,
        share_enabled: true,
        visible_metrics: [
          'balance', 'spend', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'clicks', 'impressions', 'reach', 'frequency'
        ],
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`);
  }

  return data;
}

export async function updateClientOwner(clientId: string, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ owner_id: ownerId })
    .eq('id', clientId);

  if (error) {
    throw new Error(`Erro ao atualizar gestor responsável: ${error.message}`);
  }
}

export async function updateClientMetrics(clientId: string, visibleMetrics: string[]): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ visible_metrics: visibleMetrics })
    .eq('id', clientId);

  if (error) {
    throw new Error(`Erro ao atualizar métricas do cliente: ${error.message}`);
  }
}

export async function toggleClientShare(clientId: string, shareEnabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ share_enabled: shareEnabled })
    .eq('id', clientId);

  if (error) {
    throw new Error(`Erro ao atualizar compartilhamento: ${error.message}`);
  }
}

export async function fetchClientByShareToken(token: string): Promise<{ client: Client; accounts: MetaAdAccount[] }> {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('share_token', token)
    .eq('share_enabled', true)
    .single();

  if (clientError || !client) {
    throw new Error('Link de compartilhamento inválido, expirado ou desativado pela agência.');
  }

  const { data: accounts, error: accountsError } = await supabase
    .from('meta_ad_accounts')
    .select('*')
    .eq('client_id', client.id)
    .eq('active', true)
    .order('account_name', { ascending: true });

  if (accountsError) {
    throw new Error(`Erro ao buscar contas do cliente: ${accountsError.message}`);
  }

  return { client, accounts: accounts || [] };
}

export async function createAdAccount(
  clientId: string,
  accountName: string,
  accountId: string,
  balanceType: 'auto' | 'manual' = 'auto',
  manualBalance?: number | null,
  monthlyBudget?: number | null
): Promise<MetaAdAccount> {
  let cleanAccountId = accountId.trim();
  if (!cleanAccountId.startsWith('act_')) {
    cleanAccountId = `act_${cleanAccountId}`;
  }

  const { data, error } = await supabase
    .from('meta_ad_accounts')
    .insert([
      {
        client_id: clientId,
        account_name: accountName.trim() || 'Conta Meta Ads',
        account_id: cleanAccountId,
        active: true,
        balance_type: balanceType,
        manual_balance: manualBalance !== undefined ? manualBalance : null,
        monthly_budget: monthlyBudget !== undefined ? monthlyBudget : null,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar conta de anúncios: ${error.message}`);
  }

  return data;
}

export async function updateAdAccountBalance(
  adAccountId: string,
  balanceType: 'auto' | 'manual',
  manualBalance?: number | null,
  monthlyBudget?: number | null
): Promise<void> {
  const { error } = await supabase
    .from('meta_ad_accounts')
    .update({
      balance_type: balanceType,
      manual_balance: manualBalance !== undefined ? manualBalance : null,
      monthly_budget: monthlyBudget !== undefined ? monthlyBudget : null,
    })
    .eq('id', adAccountId);

  if (error) {
    throw new Error(`Erro ao atualizar saldo da conta: ${error.message}`);
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) {
    throw new Error(`Erro ao excluir cliente: ${error.message}`);
  }
}

export async function deleteAdAccount(adAccountId: string): Promise<void> {
  const { error } = await supabase.from('meta_ad_accounts').delete().eq('id', adAccountId);
  if (error) {
    throw new Error(`Erro ao excluir conta de anúncios: ${error.message}`);
  }
}

export async function fetchProfiles(): Promise<any[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
  }

  return data || [];
}

export async function adminCreateUser(
  email: string,
  password: string,
  role: 'admin' | 'coordenador' | 'gestor',
  fullName?: string
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('manage-team', {
    body: {
      action: 'create_user',
      email,
      password,
      role,
      fullName,
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao criar usuário');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-team', {
    body: {
      action: 'delete_user',
      userId,
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao excluir usuário');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}

export async function adminUpdateUser(
  userId: string,
  newRole?: 'admin' | 'coordenador' | 'gestor',
  newPassword?: string
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-team', {
    body: {
      action: 'update_user',
      userId,
      role: newRole,
      password: newPassword,
    },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar dados do usuário');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'coordenador' | 'gestor'): Promise<void> {
  return adminUpdateUser(userId, newRole);
}




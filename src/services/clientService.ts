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

export async function createClient(name: string): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        name: name.trim(),
        owner_id: user.id,
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

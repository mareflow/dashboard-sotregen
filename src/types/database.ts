export interface Client {
  id: string;
  owner_id: string;
  name: string;
  active: boolean;
  share_token?: string;
  share_enabled?: boolean;
  visible_metrics?: string[];
  created_at: string;
}

export interface MetaAdAccount {
  id: string;
  client_id: string;
  account_id: string; // e.g. act_1614544202842808
  account_name: string | null;
  active: boolean;
  balance_type?: 'auto' | 'manual';
  manual_balance?: number | null;
  monthly_budget?: number | null;
  created_at: string;
}

export interface ClientWithAccounts extends Client {
  accounts?: MetaAdAccount[];
}

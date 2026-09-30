import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  accountId: string;
  since: string;
  until: string;
  shareToken?: string;
}

interface ActionMetric {
  action_type: string;
  value: string | number;
}

function extractLeads(actions?: ActionMetric[]): number {
  if (!actions || !Array.isArray(actions)) return 0;

  const standardLead = actions.find((a) => a.action_type === "lead");
  if (standardLead) return parseFloat(String(standardLead.value)) || 0;

  const groupedLead = actions.find((a) => a.action_type === "onsite_conversion.lead_grouped");
  if (groupedLead) return parseFloat(String(groupedLead.value)) || 0;

  const otherLead = actions.find((a) =>
    a.action_type === "omni_lead" ||
    a.action_type === "contact" ||
    a.action_type === "submit_application" ||
    a.action_type.includes("lead")
  );
  if (otherLead) return parseFloat(String(otherLead.value)) || 0;

  return 0;
}

function extractPurchases(actions?: ActionMetric[]): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const purchase = actions.find((a) => a.action_type === "purchase" || a.action_type === "omni_purchase");
  return purchase ? parseFloat(String(purchase.value)) || 0 : 0;
}

function extractRoas(actionValues?: ActionMetric[], spend?: number): number {
  if (!actionValues || !Array.isArray(actionValues) || !spend || spend <= 0) return 0;
  const purchaseValue = actionValues.find((a) => a.action_type === "purchase" || a.action_type === "omni_purchase");
  if (purchaseValue) {
    const val = parseFloat(String(purchaseValue.value)) || 0;
    return Number((val / spend).toFixed(2));
  }
  return 0;
}

function extractCpl(
  spend: number,
  leads: number,
  costPerActions?: ActionMetric[]
): number {
  if (costPerActions && Array.isArray(costPerActions)) {
    const standardCost = costPerActions.find((c) => c.action_type === "lead");
    if (standardCost) return parseFloat(String(standardCost.value)) || 0;

    const groupedCost = costPerActions.find((c) => c.action_type === "onsite_conversion.lead_grouped");
    if (groupedCost) return parseFloat(String(groupedCost.value)) || 0;
  }
  if (leads > 0 && spend > 0) {
    return Number((spend / leads).toFixed(2));
  }
  return 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido no corpo da requisição" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { accountId, since, until, shareToken } = body;
    if (!accountId || !since || !until) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes: accountId, since, until" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let realAccountId = "";
    let adAccountRecord: any = null;
    let visibleMetrics: string[] = [
      "balance", "spend", "leads", "cpl", "ctr", "cpc", "cpm", "clicks", "impressions", "reach", "frequency"
    ];

    if (shareToken) {
      const { data: adAccount, error: adAccountError } = await supabaseAdmin
        .from("meta_ad_accounts")
        .select(`
          id,
          account_id,
          account_name,
          active,
          balance_type,
          manual_balance,
          monthly_budget,
          clients!inner (
            id,
            name,
            share_token,
            share_enabled,
            visible_metrics
          )
        `)
        .eq("id", accountId)
        .single();

      if (adAccountError || !adAccount) {
        return new Response(
          JSON.stringify({ error: "Conta de anúncios não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const clientInfo = adAccount.clients as unknown as {
        id: string;
        name: string;
        share_token: string;
        share_enabled: boolean;
        visible_metrics?: string[];
      };

      if (!clientInfo.share_enabled || clientInfo.share_token !== shareToken) {
        return new Response(
          JSON.stringify({ error: "Link de compartilhamento inválido ou desativado pela agência." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      adAccountRecord = adAccount;
      realAccountId = adAccount.account_id.trim();
      if (Array.isArray(clientInfo.visible_metrics) && clientInfo.visible_metrics.length > 0) {
        visibleMetrics = clientInfo.visible_metrics;
      }
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Cabeçalho de autorização não fornecido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Sessão inválida ou expirada. Faça login novamente." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: adAccount, error: adAccountError } = await supabase
        .from("meta_ad_accounts")
        .select(`
          id,
          account_id,
          account_name,
          active,
          balance_type,
          manual_balance,
          monthly_budget,
          clients!inner (
            id,
            name,
            owner_id,
            visible_metrics
          )
        `)
        .eq("id", accountId)
        .single();

      if (adAccountError || !adAccount) {
        return new Response(
          JSON.stringify({ error: "Conta de anúncios não encontrada ou acesso não autorizado" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const clientData = adAccount.clients as unknown as {
        id: string;
        name: string;
        owner_id: string;
        visible_metrics?: string[];
      };

      // Verify role in profiles table
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role || "gestor";
      const hasFullAccess = userRole === "admin" || userRole === "coordenador";

      if (!hasFullAccess && clientData.owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Acesso negado: a conta informada pertence a outro gestor" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      adAccountRecord = adAccount;
      realAccountId = adAccount.account_id.trim();
      if (Array.isArray(clientData.visible_metrics) && clientData.visible_metrics.length > 0) {
        visibleMetrics = clientData.visible_metrics;
      }
    }

    if (!realAccountId.startsWith("act_")) {
      realAccountId = `act_${realAccountId}`;
    }

    const metaAccessToken = Deno.env.get("META_ACCESS_TOKEN");
    const metaApiVersion = Deno.env.get("META_GRAPH_API_VERSION") || "v26.0";

    if (!metaAccessToken) {
      return new Response(
        JSON.stringify({
          error: "META_ACCESS_TOKEN não está configurado nas Secrets do Supabase. Configure o secret no painel do Supabase para habilitar as consultas em tempo real.",
          code: "MISSING_META_TOKEN",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timeRangeStr = JSON.stringify({ since, until });
    const encodedTimeRange = encodeURIComponent(timeRangeStr);

    // 1. Query Ad Account Details (Balance, Spend Cap, Currency)
    let metaAccountInfo: any = null;
    try {
      const accDetailsUrl = `https://graph.facebook.com/${metaApiVersion}/${realAccountId}?fields=name,account_id,account_status,balance,currency,spend_cap,amount_spent`;
      const accRes = await fetch(accDetailsUrl, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
      });
      const accJson = await accRes.json();
      if (!accJson.error) {
        metaAccountInfo = accJson;
      } else {
        console.warn("Could not fetch account balance from Meta:", accJson.error);
      }
    } catch (e) {
      console.warn("Account details fetch error:", e);
    }

    // Determine account balance
    let accountBalance = 0;
    if (adAccountRecord?.balance_type === "manual" && adAccountRecord?.manual_balance !== null) {
      accountBalance = Number(adAccountRecord.manual_balance) || 0;
    } else if (metaAccountInfo) {
      // In Meta API, balance / spend_cap are returned in currency subunit (e.g. cents)
      const rawBalance = parseFloat(metaAccountInfo.balance || "0");
      const spendCap = parseFloat(metaAccountInfo.spend_cap || "0");
      const amountSpent = parseFloat(metaAccountInfo.amount_spent || "0");

      if (spendCap > 0 && amountSpent >= 0) {
        accountBalance = Number(((spendCap - amountSpent) / 100).toFixed(2));
      } else if (rawBalance !== 0) {
        accountBalance = Number((rawBalance / 100).toFixed(2));
      }
    }

    // 2. Query Campaign Insights
    let campaignUrl: string | null = `https://graph.facebook.com/${metaApiVersion}/${realAccountId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,cost_per_action_type,action_values&time_range=${encodedTimeRange}&limit=100`;

    const allCampaignRows: any[] = [];
    while (campaignUrl) {
      const response = await fetch(campaignUrl, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
      });
      const json = await response.json();

      if (json.error) {
        console.error("Meta API Campaign Error:", json.error);
        return new Response(
          JSON.stringify({
            error: "Erro na consulta à Meta Marketing API",
            details: json.error.message,
            type: json.error.type,
            fbtrace_id: json.error.fbtrace_id,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (Array.isArray(json.data)) {
        allCampaignRows.push(...json.data);
      }

      campaignUrl = json.paging?.next || null;
    }

    // 3. Query Account-level Insights for accurate deduplicated Reach and Totals
    const accountUrl = `https://graph.facebook.com/${metaApiVersion}/${realAccountId}/insights?fields=spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,cost_per_action_type,action_values&time_range=${encodedTimeRange}`;
    let accountData: any = null;

    try {
      const accountRes = await fetch(accountUrl, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
      });
      const accountJson = await accountRes.json();
      if (!accountJson.error && Array.isArray(accountJson.data) && accountJson.data.length > 0) {
        accountData = accountJson.data[0];
      }
    } catch (err) {
      console.warn("Could not fetch account-level insights, falling back to campaign aggregation:", err);
    }

    // 4. Normalize Campaign Data
    const campaigns = allCampaignRows.map((row: any) => {
      const spend = parseFloat(row.spend || "0");
      const impressions = parseInt(row.impressions || "0", 10);
      const reach = parseInt(row.reach || "0", 10);
      const frequency = parseFloat(row.frequency || (reach > 0 ? (impressions / reach).toFixed(2) : "1"));
      const clicks = parseInt(row.clicks || "0", 10);
      const leads = extractLeads(row.actions);
      const purchases = extractPurchases(row.actions);
      const roas = extractRoas(row.action_values, spend);
      const cpl = extractCpl(spend, leads, row.cost_per_action_type);
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : parseFloat(row.ctr || "0");
      const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : parseFloat(row.cpc || "0");
      const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : parseFloat(row.cpm || "0");

      return {
        campaignId: String(row.campaign_id || ""),
        campaignName: String(row.campaign_name || "Sem Nome"),
        spend: Number(spend.toFixed(2)),
        impressions,
        reach,
        frequency: Number(frequency.toFixed(2)),
        clicks,
        leads,
        purchases,
        roas,
        cpl: Number(cpl.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        cpc: Number(cpc.toFixed(2)),
        cpm: Number(cpm.toFixed(2)),
      };
    });

    // 5. Query Ad Sets Insights
    let adsets: any[] = [];
    try {
      const adsetUrl = `https://graph.facebook.com/${metaApiVersion}/${realAccountId}/insights?level=adset&fields=campaign_id,campaign_name,adset_id,adset_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,cost_per_action_type&time_range=${encodedTimeRange}&limit=100`;
      const adsetRes = await fetch(adsetUrl, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
      });
      const adsetJson = await adsetRes.json();
      if (!adsetJson.error && Array.isArray(adsetJson.data)) {
        adsets = adsetJson.data.map((row: any) => {
          const spend = parseFloat(row.spend || "0");
          const impressions = parseInt(row.impressions || "0", 10);
          const reach = parseInt(row.reach || "0", 10);
          const clicks = parseInt(row.clicks || "0", 10);
          const leads = extractLeads(row.actions);
          const cpl = extractCpl(spend, leads, row.cost_per_action_type);
          const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : parseFloat(row.ctr || "0");
          const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : parseFloat(row.cpc || "0");
          return {
            adsetId: String(row.adset_id || ""),
            adsetName: String(row.adset_name || "Sem Nome"),
            campaignId: String(row.campaign_id || ""),
            campaignName: String(row.campaign_name || ""),
            spend: Number(spend.toFixed(2)),
            impressions,
            reach,
            frequency: parseFloat(row.frequency || (reach > 0 ? (impressions / reach).toFixed(2) : "1")),
            clicks,
            leads,
            cpl: Number(cpl.toFixed(2)),
            ctr: Number(ctr.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
          };
        });
      }
    } catch (err) {
      console.warn("Could not fetch adsets insights:", err);
    }

    // 6. Query Ads Insights
    let ads: any[] = [];
    try {
      const adsUrl = `https://graph.facebook.com/${metaApiVersion}/${realAccountId}/insights?level=ad&fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,cost_per_action_type&time_range=${encodedTimeRange}&limit=100`;
      const adsRes = await fetch(adsUrl, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
      });
      const adsJson = await adsRes.json();
      if (!adsJson.error && Array.isArray(adsJson.data)) {
        ads = adsJson.data.map((row: any) => {
          const spend = parseFloat(row.spend || "0");
          const impressions = parseInt(row.impressions || "0", 10);
          const reach = parseInt(row.reach || "0", 10);
          const clicks = parseInt(row.clicks || "0", 10);
          const leads = extractLeads(row.actions);
          const cpl = extractCpl(spend, leads, row.cost_per_action_type);
          const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : parseFloat(row.ctr || "0");
          const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : parseFloat(row.cpc || "0");
          return {
            adId: String(row.ad_id || ""),
            adName: String(row.ad_name || "Sem Nome"),
            adsetId: String(row.adset_id || ""),
            adsetName: String(row.adset_name || ""),
            campaignId: String(row.campaign_id || ""),
            campaignName: String(row.campaign_name || ""),
            spend: Number(spend.toFixed(2)),
            impressions,
            reach,
            frequency: parseFloat(row.frequency || (reach > 0 ? (impressions / reach).toFixed(2) : "1")),
            clicks,
            leads,
            cpl: Number(cpl.toFixed(2)),
            ctr: Number(ctr.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
          };
        });
      }
    } catch (err) {
      console.warn("Could not fetch ads insights:", err);
    }

    // 7. Calculate Account Summary
    const totalSpend = accountData
      ? parseFloat(accountData.spend || "0")
      : campaigns.reduce((acc, c) => acc + c.spend, 0);

    const totalImpressions = accountData
      ? parseInt(accountData.impressions || "0", 10)
      : campaigns.reduce((acc, c) => acc + c.impressions, 0);

    const totalReach = accountData
      ? parseInt(accountData.reach || "0", 10)
      : campaigns.reduce((acc, c) => acc + c.reach, 0);

    const totalFrequency = accountData?.frequency
      ? parseFloat(accountData.frequency)
      : totalReach > 0 ? Number((totalImpressions / totalReach).toFixed(2)) : 1;

    const totalClicks = accountData
      ? parseInt(accountData.clicks || "0", 10)
      : campaigns.reduce((acc, c) => acc + c.clicks, 0);

    const totalLeads = accountData
      ? extractLeads(accountData.actions)
      : campaigns.reduce((acc, c) => acc + c.leads, 0);

    const totalPurchases = accountData
      ? extractPurchases(accountData.actions)
      : campaigns.reduce((acc, c) => acc + (c.purchases || 0), 0);

    const totalRoas = accountData
      ? extractRoas(accountData.action_values, totalSpend)
      : (totalSpend > 0 ? campaigns.reduce((acc, c) => acc + (c.roas || 0), 0) : 0);

    const totalCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const totalCpc = totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0;
    const totalCpl = totalLeads > 0
      ? Number((totalSpend / totalLeads).toFixed(2))
      : (accountData ? extractCpl(totalSpend, totalLeads, accountData.cost_per_action_type) : 0);
    const totalCpm = totalImpressions > 0 ? Number(((totalSpend / totalImpressions) * 1000).toFixed(2)) : 0;

    const summary = {
      balance: accountBalance,
      spend: Number(totalSpend.toFixed(2)),
      impressions: totalImpressions,
      reach: totalReach,
      frequency: Number(totalFrequency.toFixed(2)),
      clicks: totalClicks,
      leads: totalLeads,
      purchases: totalPurchases,
      roas: Number(totalRoas.toFixed(2)),
      cpl: Number(totalCpl.toFixed(2)),
      ctr: Number(totalCtr.toFixed(2)),
      cpc: Number(totalCpc.toFixed(2)),
      cpm: Number(totalCpm.toFixed(2)),
      currency: metaAccountInfo?.currency || "BRL",
    };

    return new Response(
      JSON.stringify({
        summary,
        campaigns,
        adsets,
        ads,
        visibleMetrics,
        accountInfo: {
          currency: metaAccountInfo?.currency || "BRL",
          accountStatus: metaAccountInfo?.account_status,
          spendCap: metaAccountInfo?.spend_cap ? metaAccountInfo.spend_cap / 100 : null,
          balanceType: adAccountRecord?.balance_type || "auto",
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Internal Server Error in meta-insights:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor ao processar insights da Meta Ads" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

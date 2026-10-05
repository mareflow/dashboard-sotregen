import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  action?: string;
  accountId?: string;
  since?: string;
  until?: string;
  shareToken?: string;
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
    const windsorApiKey = Deno.env.get("WINDSOR_API_KEY") || "fe98bf89fbd0a64f1aac8f163f02ee42f0a4";

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

    // Action 1: List all connected ad accounts from Windsor.ai
    if (body.action === "list_windsor_accounts") {
      try {
        const listUrl = `https://connectors.windsor.ai/all?api_key=${windsorApiKey}&date_preset=last_30d&fields=account_id,account_name,campaign_id,spend`;
        const res = await fetch(listUrl);
        const json = await res.json();

        const accountMap = new Map<string, string>();
        if (Array.isArray(json.data)) {
          for (const item of json.data) {
            if (item.account_id && !accountMap.has(item.account_id)) {
              accountMap.set(String(item.account_id).trim(), String(item.account_name || "Sem Nome").trim());
            }
          }
        }

        const accounts = Array.from(accountMap.entries()).map(([id, name]) => ({
          accountId: id,
          accountName: name,
        }));

        return new Response(JSON.stringify({ accounts }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: "Erro ao consultar contas no Windsor.ai", details: err?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Action 2: Get Insights for a specific account
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

    // Clean numeric account id (remove act_ prefix if present)
    const cleanAccountId = realAccountId.replace(/^act_/, "").trim();

    // Query Windsor.ai for marketing data
    const fields = [
      "account_id",
      "account_name",
      "campaign_id",
      "campaign",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
      "clicks",
      "spend",
      "impressions",
      "reach",
      "actions_lead",
      "cost_per_action_type_lead",
      "cpc",
      "cpm",
      "ctr",
    ].join(",");

    const windsorUrl = `https://connectors.windsor.ai/all?api_key=${windsorApiKey}&date_from=${encodeURIComponent(since)}&date_to=${encodeURIComponent(until)}&fields=${fields}`;

    console.log(`Querying Windsor.ai for account ${cleanAccountId} from ${since} to ${until}`);
    const windsorRes = await fetch(windsorUrl);

    if (!windsorRes.ok) {
      const errText = await windsorRes.text();
      console.error("Windsor API error:", errText);
      return new Response(
        JSON.stringify({
          error: "Erro na consulta aos dados via Windsor.ai",
          details: errText,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const windsorData = await windsorRes.json();
    const allRows: any[] = Array.isArray(windsorData?.data) ? windsorData.data : [];

    // Filter rows for this specific ad account
    const matchedRows = allRows.filter((row: any) => {
      const rowAccId = String(row.account_id || "").replace(/^act_/, "").trim();
      return rowAccId === cleanAccountId;
    });

    console.log(`Matched ${matchedRows.length} rows for account ${cleanAccountId}`);

    // Aggregate Ads
    const adsMap = new Map<string, any>();
    for (const row of matchedRows) {
      const adId = String(row.ad_id || row.campaign_id || Math.random().toString());
      const spend = parseFloat(row.spend || "0");
      const impressions = parseInt(row.impressions || "0", 10);
      const reach = parseInt(row.reach || "0", 10);
      const clicks = parseInt(row.clicks || "0", 10);
      const leads = parseFloat(row.actions_lead || "0");

      if (!adsMap.has(adId)) {
        adsMap.set(adId, {
          adId,
          adName: String(row.ad_name || "Anúncio"),
          adsetId: String(row.adset_id || ""),
          adsetName: String(row.adset_name || ""),
          campaignId: String(row.campaign_id || ""),
          campaignName: String(row.campaign || ""),
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
          leads: 0,
        });
      }

      const existing = adsMap.get(adId);
      existing.spend += spend;
      existing.impressions += impressions;
      existing.reach += reach;
      existing.clicks += clicks;
      existing.leads += leads;
    }

    const ads = Array.from(adsMap.values()).map((ad) => {
      const cpl = ad.leads > 0 ? Number((ad.spend / ad.leads).toFixed(2)) : 0;
      const ctr = ad.impressions > 0 ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0;
      const cpc = ad.clicks > 0 ? Number((ad.spend / ad.clicks).toFixed(2)) : 0;
      return {
        ...ad,
        spend: Number(ad.spend.toFixed(2)),
        cpl,
        ctr,
        cpc,
      };
    });

    // Aggregate AdSets
    const adsetsMap = new Map<string, any>();
    for (const ad of ads) {
      const adsetId = ad.adsetId || ad.campaignId || "default";
      if (!adsetsMap.has(adsetId)) {
        adsetsMap.set(adsetId, {
          adsetId,
          adsetName: ad.adsetName || "Conjunto",
          campaignId: ad.campaignId,
          campaignName: ad.campaignName,
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
          leads: 0,
        });
      }
      const existing = adsetsMap.get(adsetId);
      existing.spend += ad.spend;
      existing.impressions += ad.impressions;
      existing.reach += ad.reach;
      existing.clicks += ad.clicks;
      existing.leads += ad.leads;
    }

    const adsets = Array.from(adsetsMap.values()).map((adset) => {
      const cpl = adset.leads > 0 ? Number((adset.spend / adset.leads).toFixed(2)) : 0;
      const ctr = adset.impressions > 0 ? Number(((adset.clicks / adset.impressions) * 100).toFixed(2)) : 0;
      const cpc = adset.clicks > 0 ? Number((adset.spend / adset.clicks).toFixed(2)) : 0;
      return {
        ...adset,
        spend: Number(adset.spend.toFixed(2)),
        cpl,
        ctr,
        cpc,
      };
    });

    // Aggregate Campaigns
    const campaignsMap = new Map<string, any>();
    for (const adset of adsets) {
      const campId = adset.campaignId || "default";
      if (!campaignsMap.has(campId)) {
        campaignsMap.set(campId, {
          campaignId: campId,
          campaignName: adset.campaignName || "Campanha",
          spend: 0,
          impressions: 0,
          reach: 0,
          clicks: 0,
          leads: 0,
        });
      }
      const existing = campaignsMap.get(campId);
      existing.spend += adset.spend;
      existing.impressions += adset.impressions;
      existing.reach += adset.reach;
      existing.clicks += adset.clicks;
      existing.leads += adset.leads;
    }

    const campaigns = Array.from(campaignsMap.values()).map((camp) => {
      const cpl = camp.leads > 0 ? Number((camp.spend / camp.leads).toFixed(2)) : 0;
      const ctr = camp.impressions > 0 ? Number(((camp.clicks / camp.impressions) * 100).toFixed(2)) : 0;
      const cpc = camp.clicks > 0 ? Number((camp.spend / camp.clicks).toFixed(2)) : 0;
      const cpm = camp.impressions > 0 ? Number(((camp.spend / camp.impressions) * 1000).toFixed(2)) : 0;
      return {
        ...camp,
        spend: Number(camp.spend.toFixed(2)),
        cpl,
        ctr,
        cpc,
        cpm,
      };
    });

    // Summary calculations
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
    const totalReach = campaigns.reduce((acc, c) => acc + c.reach, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const totalLeads = campaigns.reduce((acc, c) => acc + c.leads, 0);

    const totalCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
    const totalCpc = totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0;
    const totalCpl = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0;
    const totalCpm = totalImpressions > 0 ? Number(((totalSpend / totalImpressions) * 1000).toFixed(2)) : 0;
    const totalFrequency = totalReach > 0 ? Number((totalImpressions / totalReach).toFixed(2)) : 1;

    let accountBalance = 0;
    if (adAccountRecord?.balance_type === "manual" && adAccountRecord?.manual_balance !== null) {
      accountBalance = Number(adAccountRecord.manual_balance) || 0;
    }

    const summary = {
      balance: accountBalance,
      spend: Number(totalSpend.toFixed(2)),
      impressions: totalImpressions,
      reach: totalReach,
      frequency: totalFrequency,
      clicks: totalClicks,
      leads: totalLeads,
      cpl: totalCpl,
      ctr: totalCtr,
      cpc: totalCpc,
      cpm: totalCpm,
      currency: "BRL",
    };

    return new Response(
      JSON.stringify({
        summary,
        campaigns,
        adsets,
        ads,
        visibleMetrics,
        accountInfo: {
          currency: "BRL",
          balanceType: adAccountRecord?.balance_type || "manual",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Internal Server Error in meta-insights:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor ao processar insights via Windsor.ai", details: err?.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

# 🌊 Maré Flow - Dashboard Meta Ads

Sistema completo e profissional de análise de tráfego pago da **Maré Flow**, integrado em tempo real com a **Meta Marketing API** através do ecossistema serverless do **Supabase** (Auth, Database com RLS e Edge Functions).

---

## 🏗️ Arquitetura do Sistema

```
Frontend (React + Vite + TS)
       ↓ (JWT do Administrador OU Token do Cliente)
Supabase (Auth + Banco com RLS)
       ↓ (Invoca com segurança)
Supabase Edge Function (meta-insights)
       ↓ (META_ACCESS_TOKEN seguro no Deno.env)
Meta Marketing API (Graph API)
```

- **Sem VPS, sem n8n, sem Windsor.ai, sem servidores intermediários.**
- **Segurança Máxima:** O token da Meta nunca é exposto no frontend ou no banco. Fica restrito às Secrets do Supabase.
- **Dois Níveis de Acesso:**
  1. **Administrador (Agência / Maré Flow):** Acesso completo, gerenciamento de clientes, contas de anúncios, personalização das métricas visíveis e configuração de saldo/orçamento.
  2. **Portal do Cliente (Somente Leitura):** Acesso via link exclusivo (`?token=...`), com visualização restrita **apenas às métricas selecionadas pela agência** e liberdade para alterar o período de análise.
- **Controle de Saldo em Conta:** Suporte a saldo automático via Meta API (pré-pago / limite de gastos) ou definição de saldo/orçamento manual pela agência.
- **Tempo Real:** Consulta direta à Meta API a cada mudança de conta ou período no dashboard.

---

## 🚀 Como Visualizar a Prévia / Rodar o Projeto

O servidor de desenvolvimento do Vite já está ativo na sua máquina:

👉 **[http://localhost:5173](http://localhost:5173)**

Caso precise reiniciar:
```bash
npm run dev
```

---

## ⚙️ Configuração do Supabase

### 1. Criar o Projeto no Supabase
1. Acesse [database.new](https://database.new) e crie um novo projeto.
2. Anote a **URL do Projeto** e a **chave pública (anon key)** em *Project Settings > API*.

### 2. Configurar Variáveis de Ambiente no Frontend
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 3. Migrations do Banco de Dados
Execute as migrations em [`supabase/migrations/`](file:///c:/Users/Acer/Desktop/sistemas/Fase%20Inicial/DASHBOARD/supabase/migrations/):
- `clients`: guarda os clientes, `share_token`, `share_enabled` e `visible_metrics`.
- `meta_ad_accounts`: guarda as contas, `balance_type`, `manual_balance` e `monthly_budget`.
- RLS e políticas configuradas.

---

## 🔐 Configuração das Secrets da Meta no Supabase

No painel do Supabase (**Project Settings > Edge Functions > Secrets**):
- `META_ACCESS_TOKEN`: Token da Meta Marketing API com permissão `ads_read`.
- `META_GRAPH_API_VERSION`: `v26.0` (ou versão desejada).

---

## ⚡ Deploy da Edge Function (`meta-insights`)

Deploy via Supabase CLI:
```bash
supabase functions deploy meta-insights --no-verify-jwt
```

---

## 📋 Como Personalizar Métricas, Saldo e Compartilhar com o Cliente

### 1. Personalizar Métricas que o Cliente Vê
1. No Dashboard ou na tela de Configurações, clique no botão **"Métricas, Saldo & Link"**.
2. Marque/desmarque as métricas desejadas:
   - **Financeiro:** Saldo em Conta, Investimento, CPC, CPM.
   - **Conversão:** Leads, Custo por Lead (CPL), Vendas/Compras, ROAS.
   - **Desempenho:** CTR, Cliques, Impressões, Alcance, Frequência.
3. Você também pode usar os atalhos: **Foco em Leads**, **E-commerce / ROAS** ou **Todas**.

### 2. Configurar o Saldo da Conta
No mesmo modal:
- **Automático via Meta API:** o sistema busca o saldo pré-pago ou o limite de gastos restante da conta diretamente na Meta.
- **Manual (R$):** você pode digitar o saldo atual do cliente ou o orçamento mensal contratado.
- O card **SALDO EM CONTA** aparecerá no dashboard com o valor formatado em R$.

### 3. Enviar o Link para o Cliente
1. No modal ou na listagem de clientes, clique em **"Copiar Link"**.
2. Envie o link gerado (ex: `http://localhost:5173/?token=...`) para o cliente.
3. Quando o cliente abrir:
   - Verá o painel com o nome dele e marca Maré Flow.
   - Verá **somente as métricas que você marcou**.
   - Terá liberdade total para alternar períodos (7 dias, 14 dias, 30 dias, este mês, personalizado).
   - Não terá acesso a configurações, outras contas ou secrets da agência.

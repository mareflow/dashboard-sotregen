import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ManageTeamBody {
  action: "create_user" | "delete_user" | "update_user" | "list_users";
  email?: string;
  password?: string;
  fullName?: string;
  role?: "admin" | "coordenador" | "gestor";
  userId?: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify caller session
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await supabaseUserClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify admin privilege
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey);
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, email")
      .eq("id", caller.id)
      .single();

    if (profileError || callerProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem gerenciar a equipe e criar/excluir usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: ManageTeamBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = body;

    // ACTION: CREATE USER
    if (action === "create_user") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;
      const role = body.role || "gestor";
      const fullName = body.fullName?.trim() || email?.split("@")[0] || "Colaborador";

      if (!email || !password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: "E-mail válido e senha de no mínimo 6 caracteres são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create user in Supabase Auth
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert profile with chosen role
      const userId = newUserData.user.id;
      const { error: profileUpsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          role,
          updated_at: new Date().toISOString(),
        });

      if (profileUpsertError) {
        console.error("Profile upsert error:", profileUpsertError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Usuário ${email} criado com sucesso com o cargo de ${role}!`,
          user: { id: userId, email, role, full_name: fullName },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: DELETE USER
    if (action === "delete_user") {
      const targetUserId = body.userId;
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: "ID do usuário obrigatório para exclusão." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (targetUserId === caller.id) {
        return new Response(
          JSON.stringify({ error: "Você não pode excluir sua própria conta de administrador." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete from Supabase Auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: `Erro ao excluir usuário: ${deleteError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete profile
      await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

      return new Response(
        JSON.stringify({ success: true, message: "Usuário excluído com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: UPDATE USER (Role or Password)
    if (action === "update_user") {
      const targetUserId = body.userId;
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: "ID do usuário obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password if provided
      if (body.password && body.password.length >= 6) {
        const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: body.password,
        });
        if (passError) {
          return new Response(
            JSON.stringify({ error: `Erro ao alterar senha: ${passError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update role if provided
      if (body.role) {
        const { error: roleError } = await supabaseAdmin
          .from("profiles")
          .update({
            role: body.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetUserId);

        if (roleError) {
          return new Response(
            JSON.stringify({ error: `Erro ao alterar cargo: ${roleError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Dados do usuário atualizados com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Ação não reconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Internal Server Error in manage-team:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor ao gerenciar equipe." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "@supabase/supabase-js";

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(
    token
  );

  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profileData } = await supabaseAuth
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profileData?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { targetUserId } = await request.json();

  if (!targetUserId) {
    return new Response("Bad request", { status: 400 });
  }

  if (targetUserId === userData.user.id) {
    return new Response("Impossible de supprimer votre propre compte.", {
      status: 400,
    });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    targetUserId
  );

  if (deleteError) {
    console.error(deleteError);
    return new Response("Delete failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

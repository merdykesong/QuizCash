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

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }

  const emails = data.users.map((u) => ({ id: u.id, email: u.email }));

  return new Response(JSON.stringify({ emails }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

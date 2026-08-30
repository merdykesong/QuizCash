import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token
  );

  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { pseudo, email, sujet, message } = await request.json();

  if (!pseudo || !email || !sujet || !message) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "QuizCash <onboarding@resend.dev>",
        to: "merdykesong00@gmail.com",
        subject: `Nouveau message : ${sujet}`,
        html: `
          <p><strong>De :</strong> ${pseudo} (${email})</p>
          <p><strong>Sujet :</strong> ${sujet}</p>
          <p><strong>Message :</strong></p>
          <p>${message}</p>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return new Response("Email failed", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(request) {
  const secret = request.headers.get("x-webhook-secret");

  if (secret !== process.env.CONTACT_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await request.json();
  const record = payload.record;

  if (!record) {
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
        subject: `Nouveau message : ${record.sujet}`,
        html: `
          <p><strong>De :</strong> ${record.pseudo} (${record.email})</p>
          <p><strong>Sujet :</strong> ${record.sujet}</p>
          <p><strong>Message :</strong></p>
          <p>${record.message}</p>
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

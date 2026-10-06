// POST /api/review — public submission endpoint
// Spam defense: honeypot field + per-IP rate limit (D1) + origin check + Turnstile (optional env)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("origin") || "";
  const host = request.headers.get("host") || "";
  if (origin && !origin.includes(host)) return json({ error: "bad origin" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  // honeypot: bots fill hidden "website" field — pretend success, store nothing
  if (body.website) return json({ ok: true });

  const name = (body.name || "").toString().trim().slice(0, 120);
  const email = (body.email || "").toString().trim().slice(0, 200);
  const company = (body.company || "").toString().trim().slice(0, 120);
  const relation = (body.relation || "").toString().trim().slice(0, 40);
  const text = (body.review || "").toString().trim().slice(0, 2000);

  if (!name || !email || !text)
    return json({ error: "name, email and review are required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: "valid email required" }, 400);
  if (text.length < 20)
    return json({ error: "review is too short" }, 400);
  if (!["client", "agency", "colleague"].includes(relation))
    return json({ error: "select a valid relation" }, 400);

  if (!env.DB) return json({ error: "server not configured" }, 500);

  // per-IP rate limit: max 3 submissions per hour
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const salt = env.ADMIN_SECRET || "fallback-salt";
  const ipHash = await digest(salt + ip);
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM reviews WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')"
  )
    .bind(ipHash)
    .first();
  if (recent && recent.n >= 3) return json({ error: "too many submissions, try later" }, 429);

  // optional Turnstile verification (enabled when TURNSTILE_SECRET is set)
  if (env.TURNSTILE_SECRET && body.turnstileToken) {
    const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: body.turnstileToken,
      }),
    });
    const vrj = await vr.json();
    if (!vrj.success) return json({ error: "captcha failed" }, 400);
  }

  await env.DB.prepare(
    "INSERT INTO reviews (name, email, company, relation, body, ip_hash) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(name, email, company, relation, text, ipHash)
    .run();

  // WhatsApp notification via CallMeBot (optional env)
  if (env.CALLMEBOT_PHONE && env.CALLMEBOT_APIKEY) {
    const msg = encodeURIComponent(
      `New portfolio review from ${name}${company ? " (" + company + ")" : ""} — check the admin page.`
    );
    fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${env.CALLMEBOT_PHONE}&text=${msg}&apikey=${env.CALLMEBOT_APIKEY}`
    ).catch(() => {});
  }

  return json({ ok: true });
}

async function digest(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

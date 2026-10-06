// POST /api/admin/login — { password } → signed HttpOnly session cookie (7 days)

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// constant-time-ish compare
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SECRET)
    return json({ error: "server not configured" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad request" }, 400); }

  const pass = (body.password || "").toString();
  const good = await hmac(env.ADMIN_SECRET, "pw:" + pass);
  const want = await hmac(env.ADMIN_SECRET, "pw:" + env.ADMIN_PASSWORD);
  if (!safeEqual(good, want)) return json({ error: "wrong password" }, 401);

  const expires = Date.now() + 7 * 24 * 3600 * 1000;
  const sig = await hmac(env.ADMIN_SECRET, "admin:" + expires);
  const token = `${expires}.${sig}`;
  return json(
    { ok: true },
    200,
    {
      "set-cookie": `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 3600}`,
    }
  );
}

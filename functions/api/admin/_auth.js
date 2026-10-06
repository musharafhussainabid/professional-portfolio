// shared auth helper — validates the admin_session cookie
export async function isAuthed(request, env) {
  if (!env.ADMIN_SECRET) return false;
  const cookies = request.headers.get("cookie") || "";
  const m = cookies.match(/admin_session=(\d+)\.([a-f0-9]+)/);
  if (!m) return false;
  const [, expires, sig] = m;
  if (parseInt(expires) < Date.now()) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const s = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("admin:" + expires));
  const want = [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sig.length !== want.length) return false;
  let r = 0;
  for (let i = 0; i < want.length; i++) r |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return r === 0;
}

// POST /api/admin/logout — clears the session cookie
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    },
  });
}

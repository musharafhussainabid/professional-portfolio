// GET /api/admin/reviews — auth required; lists all submissions newest first
import { isAuthed } from "./_auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!(await isAuthed(request, env)))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  const { results } = await env.DB.prepare(
    "SELECT id, name, email, company, relation, body, status, created_at FROM reviews ORDER BY id DESC LIMIT 100"
  ).all();
  return new Response(JSON.stringify(results || []), {
    headers: { "content-type": "application/json" },
  });
}

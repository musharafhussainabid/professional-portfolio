// POST /api/admin/action — auth required; { id, action: "approve" | "reject" | "pending" }
import { isAuthed } from "./_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await isAuthed(request, env)))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  let body;
  try { body = await request.json(); } catch { return new Response("bad", { status: 400 }); }
  const id = parseInt(body.id);
  const action = body.action;
  if (!id || !["approve", "reject", "pending"].includes(action))
    return new Response(JSON.stringify({ error: "bad action" }), { status: 400 });

  await env.DB.prepare("UPDATE reviews SET status = ? WHERE id = ?")
    .bind(action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending", id)
    .run();
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}

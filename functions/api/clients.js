// GET /api/clients — public JSON of APPROVED reviews (newest first)

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return new Response(JSON.stringify([]), {
    headers: { "content-type": "application/json" },
  });
  const { results } = await env.DB.prepare(
    "SELECT name, company, relation, body FROM reviews WHERE status = 'approved' ORDER BY id DESC LIMIT 12"
  ).all();
  return new Response(JSON.stringify(results || []), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
}

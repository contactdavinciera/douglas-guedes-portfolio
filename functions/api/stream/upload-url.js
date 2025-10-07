export async function onRequest({ env, request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method !== "POST")   return json({ ok:false, error:"Method not allowed" }, 405, request);

  const accountId = (env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken  = (env.CLOUDFLARE_API_TOKEN || "").trim();
  if (!accountId || !apiToken) return json({ ok:false, error:"Missing env vars (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)" }, 500, request);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;

  // Definir explicitamente o expiry para 5 horas e 50 minutos
  const now = Date.now();
  const fiveHoursFiftyMinutesMs = (5 * 60 * 60 * 1000) + (50 * 60 * 1000);
  const expiry = new Date(now + fiveHoursFiftyMinutesMs).toISOString();

  const payload = {
    expiry: expiry,
    creator: "douglas-portfolio"
  };

  console.log("Payload being sent to Cloudflare Stream API:", JSON.stringify(payload, null, 2));

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await resp.json().catch(() => ({}));
  return json({ ok: resp.ok, status: resp.status, cf: data }, resp.status, request);
}

function cors(req){
  const o = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": o,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}
function json(obj, status, req){
  return new Response(JSON.stringify(obj, null, 2), { status, headers: { "Content-Type":"application/json", ...cors(req) }});
}
export async function onRequestOptions({ request }) {
  return new Response(null, { status:204, headers: cors(request) });
}

export async function onRequest(context) {
  const { env, request } = context;

  // Só POST
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405, request);
  }

  // Lê envs (e “trima” pra evitar espaço colado)
  const accountId = (env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken  = (env.CLOUDFLARE_API_TOKEN || "").trim();
  if (!accountId || !apiToken) {
    return json({
      ok: false,
      error: "Missing env vars (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)"
    }, 500, request);
  }

  const now = Date.now();
  const sixHoursMs = 6 * 60 * 60 * 1000; // 6 horas em milissegundos
  let requestedExpiry; // ISO do body (opcional)

  try {
    const body = await request.json().catch(() => ({}));
    requestedExpiry = body?.expiry; // ISO ex: "2025-07-14T15:30:00Z"
  } catch { /* ignore */ }

  let expiry;
  if (requestedExpiry) {
    const reqMs = Date.parse(requestedExpiry);
    if (!isNaN(reqMs)) {
      const clamped = Math.min(reqMs, now + sixHoursMs - 60_000); // -1min de folga
      expiry = new Date(clamped).toISOString();
    }
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;
  
  // Payload simplificado
  const payload = {
    ...(expiry ? { expiry } : {}),
    creator: "douglas-portfolio"
  };

  let resp, data, text;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    text = await resp.text(); // capture bruto
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  } catch (e) {
    console.error("Fetch failed:", e);
    return json({ ok:false, error:"Fetch to Stream API failed", detail: String(e) }, 502, request);
  }

  // Loga no console da Pages para facilitar
  console.log("Stream direct_upload status:", resp.status, "body:", text);

  // Devolve o que a API respondeu (sucesso ou erro)
  return json({
    ok: resp.ok,
    status: resp.status,
    endpoint: url,
    sent: payload,
    cf: data   // esperado: { success:true, result:{ uploadURL, uid, ... }, ... }
  }, resp.status, request);
}

function corsHeaders(request) {
  const o = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": o,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}
function json(obj, status, request) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) }
  });
}
export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}


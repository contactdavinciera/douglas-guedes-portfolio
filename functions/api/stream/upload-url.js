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

  // Configs padrão (pode vir do body)
  const reqOrigin = request.headers.get("Origin") || "";
  let maxDurationSeconds = 3600;
  // Corrigido: expiry deve ser menor que 6 horas no futuro
  let expiry = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5 horas para ficar dentro do limite de 6h
  console.log("Expiry value being sent:", expiry); // Log para depuração
  let allowedOrigins = [reqOrigin.replace(/^https?:\/\//, "") || "douglas-guedes-portfolio.pages.dev"];
  
  try {
    const body = await request.json().catch(() => ({}));
    if (body.maxDurationSeconds) maxDurationSeconds = body.maxDurationSeconds;
    if (body.expiry) expiry = body.expiry;
    if (Array.isArray(body.allowedOrigins) && body.allowedOrigins.length) {
      allowedOrigins = body.allowedOrigins.map(origin => origin.replace(/^https?:\/\//, ""));
    }
  } catch { /* ignore */ }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;
  const payload = {
    maxDurationSeconds,
    expiry,
    allowedOrigins,
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


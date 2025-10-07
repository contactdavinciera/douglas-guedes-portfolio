// File: functions/api/stream/upload-url.js
// Cloudflare Pages Function – gera URL de upload (TUS) do Cloudflare Stream
export async function onRequest(context) {
  const { env, request } = context;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const ORIGIN_ALLOWLIST = [
    "https://douglas-guedes-portfolio.pages.dev"
  ];

  let maxDurationSeconds = 3600;
  let expiry = new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(); // 5 hours to stay within 6h limit

  try {
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (body.maxDurationSeconds) maxDurationSeconds = body.maxDurationSeconds;
      if (body.expiry) expiry = body.expiry;
    }
  } catch (_) {}

  if (!accountId || !apiToken) {
    return new Response(JSON.stringify({ success: false, error: "Missing env vars (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)" }), {
      status: 500,
      headers: corsHeaders(request, ORIGIN_ALLOWLIST)
    });
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;
  const payload = {
    maxDurationSeconds,
    expiry,
    allowedOrigins: ORIGIN_ALLOWLIST,
    creator: "douglas-portfolio"
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json().catch(() => ({}));

  return new Response(JSON.stringify(data, null, 2), {
    status: resp.status,
    headers: {
      ...corsHeaders(request, ORIGIN_ALLOWLIST),
      "Content-Type": "application/json"
    }
  });
}

function corsHeaders(request, allowlist) {
  const reqOrigin = request.headers.get("Origin") || "";
  const allowed = allowlist.includes(reqOrigin) ? reqOrigin : allowlist[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request, ["*"])
  });
}


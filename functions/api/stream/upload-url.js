export async function onRequest({ env }) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return new Response(JSON.stringify({ success: false, error: "Missing env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),   // começa simples
  });

  const data = await resp.json();

  return new Response(JSON.stringify(data, null, 2), {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
}

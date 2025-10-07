export async function onRequest({ env }) {
  return new Response(JSON.stringify({
    has_ACCOUNT_ID: !!env.CLOUDFLARE_ACCOUNT_ID,
    has_API_TOKEN: !!env.CLOUDFLARE_API_TOKEN,
  }, null, 2), { headers: { "Content-Type": "application/json" }});
}


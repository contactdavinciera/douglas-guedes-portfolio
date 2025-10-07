// POST /api/stream/upload
// retorna { uploadURL, uid } para você enviar o vídeo direto ao Cloudflare Stream

export const onRequestPost: PagesFunction<{
  CLOUDFLARE_ACCOUNT_ID: string;  // ex.: "123abc..."
  STREAM_TOKEN?: string;           // API Token com permissão de Stream:Edit
}> = async (ctx) => {
  const { env } = ctx;

  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.STREAM_TOKEN;

  if (!accountId || !token) {
    return new Response(
      JSON.stringify({ error: "Missing CLOUDFLARE_ACCOUNT_ID or STREAM_TOKEN" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // personalize como quiser:
        maxDurationSeconds: 3600,
        // allowedOrigins pode ser o seu domínio para restringir
        allowedOrigins: ["*"],
        // grava metadados úteis:
        meta: { source: "pages-function", at: new Date().toISOString() },
      }),
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data.result ?? data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};

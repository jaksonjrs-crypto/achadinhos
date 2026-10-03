const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

function accessToken() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  if (!token || !userId) throw new Error("Instagram não configurado: informe INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID.");
  return { token, userId };
}

export function instagramConfigured() {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim() && process.env.INSTAGRAM_USER_ID?.trim());
}

async function graph(path: string, init?: RequestInit) {
  const { token } = accessToken();
  const host = token.startsWith("IG") ? "graph.instagram.com" : "graph.facebook.com";
  const url = new URL(`https://${host}/${GRAPH_VERSION}${path}`);
  if (init?.method !== "POST") url.searchParams.set("access_token", token);
  const headers = new Headers(init?.headers);
  if (init?.method === "POST" && init.body instanceof URLSearchParams) {
    init.body.set("access_token", token);
  }
  return fetch(url, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20000) });
}

function apiError(data: any, status: number) {
  const { token } = accessToken();
  const message = String(data?.error?.message || status).replaceAll(token, "[redacted]").slice(0, 220);
  if (data?.error?.code === 190) return new Error("Instagram: token recusado. Confira se o token está completo, válido e pertence à conta configurada.");
  return new Error(`Instagram: ${message}`);
}

export async function verifyInstagramConnection() {
  const { userId } = accessToken();
  const response = await graph(`/${encodeURIComponent(userId)}?fields=id,username`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw apiError(data, response.status);
  return { id: String(data.id), username: String(data.username || "") };
}

async function waitForMedia(creationId: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await graph(`/${encodeURIComponent(creationId)}?fields=status_code`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw apiError(data, response.status);
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error("Instagram: não foi possível processar a imagem. Confira a imagem pública da oferta.");
    }
    if (data.status_code !== "IN_PROGRESS") {
      throw new Error("Instagram: estado de processamento inesperado. Confira a conta antes de tentar novamente.");
    }
    if (attempt < 9) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("Instagram: a imagem ainda está em processamento. Nenhum pedido de publicação foi enviado.");
}

export async function publishInstagramImage(input: { imageUrl: string; caption: string }) {
  const { userId } = accessToken();
  await verifyInstagramConnection();
  const create = await graph(`/${encodeURIComponent(userId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: input.imageUrl, caption: input.caption.slice(0, 2200) }),
  });
  const created = await create.json().catch(() => ({}));
  if (!create.ok || !created.id) throw apiError(created, create.status);

  await waitForMedia(String(created.id));

  const publish = await graph(`/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: String(created.id) }),
  });
  const published = await publish.json().catch(() => ({}));
  if (!publish.ok || !published.id) throw apiError(published, publish.status);
  return { creationId: String(created.id), mediaId: String(published.id) };
}

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
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  if (init?.method !== "POST") url.searchParams.set("access_token", token);
  const headers = new Headers(init?.headers);
  if (init?.method === "POST") headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function publishInstagramImage(input: { imageUrl: string; caption: string }) {
  const { userId } = accessToken();
  const create = await graph(`/${encodeURIComponent(userId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: input.imageUrl, caption: input.caption.slice(0, 2200) }),
  });
  const created = await create.json().catch(() => ({}));
  if (!create.ok || !created.id) throw new Error(`Instagram: ${String(created?.error?.message || create.status).slice(0, 220)}`);

  const publish = await graph(`/${encodeURIComponent(userId)}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: String(created.id) }),
  });
  const published = await publish.json().catch(() => ({}));
  if (!publish.ok || !published.id) throw new Error(`Instagram: ${String(published?.error?.message || publish.status).slice(0, 220)}`);
  return { creationId: String(created.id), mediaId: String(published.id) };
}

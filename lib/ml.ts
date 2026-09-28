import { db } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";

const API = "https://api.mercadolibre.com";
const SITE_ID = process.env.MERCADO_LIVRE_SITE_ID || "MLB";

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  user_id: number | string;
  refresh_token?: string;
};

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const clientId = process.env.MERCADO_LIVRE_CLIENT_ID;
  const clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET;
  const redirectUri = process.env.MERCADO_LIVRE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Credenciais OAuth incompletas.");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  });

  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "Falha ao trocar code por token.");
  return data;
}

export async function saveConnection(t: TokenResponse) {
  const sql = db();
  const expiresAt = new Date(Date.now() + Math.max(0, (t.expires_in || 0) - 60) * 1000);
  await sql`
    INSERT INTO marketplace_connections
      (marketplace, external_user_id, access_token_enc, refresh_token_enc, token_type, expires_at, scopes, updated_at)
    VALUES
      ('mercadolivre', ${String(t.user_id)}, ${encryptSecret(t.access_token)},
       ${t.refresh_token ? encryptSecret(t.refresh_token) : null}, ${t.token_type || "Bearer"},
       ${expiresAt.toISOString()}, ${t.scope || null}, NOW())
    ON CONFLICT (marketplace, external_user_id)
    DO UPDATE SET
      access_token_enc = EXCLUDED.access_token_enc,
      refresh_token_enc = COALESCE(EXCLUDED.refresh_token_enc, marketplace_connections.refresh_token_enc),
      token_type = EXCLUDED.token_type,
      expires_at = EXCLUDED.expires_at,
      scopes = EXCLUDED.scopes,
      updated_at = NOW()
  `;
}

async function latestConnection() {
  const sql = db();
  const rows = await sql`
    SELECT * FROM marketplace_connections
    WHERE marketplace = 'mercadolivre'
    ORDER BY updated_at DESC LIMIT 1
  `;
  return rows[0] as any;
}

async function refresh(row: any) {
  if (!row?.refresh_token_enc) throw new Error("Refresh token não disponível.");
  const clientId = process.env.MERCADO_LIVRE_CLIENT_ID!;
  const clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET!;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: decryptSecret(row.refresh_token_enc)
  });

  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "Falha ao renovar token.");
  await saveConnection(data);
  return data.access_token as string;
}

export async function getAccessToken() {
  const row = await latestConnection();
  if (!row) throw new Error("Mercado Livre ainda não conectado.");
  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (expires > Date.now() + 60_000) return decryptSecret(row.access_token_enc);
  return refresh(row);
}

export async function mlFetch(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (res.status === 401) {
    const row = await latestConnection();
    const fresh = await refresh(row);
    return fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${fresh}` },
      cache: "no-store"
    });
  }
  return res;
}

export { SITE_ID };

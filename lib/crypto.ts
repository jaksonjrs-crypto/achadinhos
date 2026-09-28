import crypto from "node:crypto";

function key() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY não configurado.");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY deve ter 32 bytes em Base64.");
  return buf;
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(x => x.toString("base64url")).join(".");
}

export function decryptSecret(payload: string) {
  const [iv64, tag64, data64] = payload.split(".");
  if (!iv64 || !tag64 || !data64) throw new Error("Token criptografado inválido.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv64, "base64url"));
  decipher.setAuthTag(Buffer.from(tag64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data64, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

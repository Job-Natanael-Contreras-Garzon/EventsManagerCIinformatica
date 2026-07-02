export interface JWTPayload {
  userId: string;
  username: string;
  name: string;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-ci-informatica-events-key-2026-xyz";

function base64url(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlFromString(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(escape(atob(base64)));
}

async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Firma un payload de datos de usuario en un token JWT.
 * El token expira en 24 horas.
 * @param payload Datos del usuario (id, username, nombre)
 * @returns Token JWT string firmado
 */
export async function signJWT(payload: Omit<JWTPayload, "exp">): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: JWTPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  };

  const encodedHeader = base64urlFromString(JSON.stringify(header));
  const encodedPayload = base64urlFromString(JSON.stringify(fullPayload));
  const tokenInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(tokenInput)
  );

  const signature = base64url(new Uint8Array(signatureBuffer));
  return `${tokenInput}.${signature}`;
}

/**
 * Verifica un token JWT utilizando Web Crypto API.
 * Retorna el payload decodificado si es válido, o null si es inválido o expiró.
 * @param token Token JWT string
 * @returns Payload decodificado o null
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;

    const key = await getCryptoKey();
    const signatureBytes = new Uint8Array(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(tokenInput)
    );

    if (!isValid) return null;

    const payload: JWTPayload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp < Date.now() / 1000) {
      return null; // Expirado
    }

    return payload;
  } catch (error) {
    return null;
  }
}

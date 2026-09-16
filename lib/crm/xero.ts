import crypto from "node:crypto";
import { supabaseRequest } from "@/lib/crm/supabase-server";

const AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
const TOKEN_URL = "https://identity.xero.com/connect/token";
const CONNECTIONS_URL = "https://api.xero.com/connections";
const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.invoices",
  "accounting.payments.read",
  "accounting.contacts",
].join(" ");

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
};

type StoredConnection = {
  tenant_id: string;
  tenant_name: string | null;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  expires_at: string;
  scopes: string | null;
};

function cfg() {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Xero is not configured");
  return { clientId, clientSecret, redirectUri };
}

function key() {
  return crypto.createHash("sha256").update(cfg().clientSecret).digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) throw new Error("Invalid encrypted secret");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
}

export function getXeroAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = cfg();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = cfg();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Xero token request failed (${response.status})`);
  return response.json() as Promise<TokenResponse>;
}

export async function exchangeXeroCode(code: string) {
  const { redirectUri } = cfg();
  return tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
}

export async function getXeroTenants(accessToken: string) {
  const response = await fetch(CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Unable to read Xero connections (${response.status})`);
  return response.json() as Promise<Array<{ tenantId: string; tenantName?: string; tenantType?: string }>>;
}

export async function saveXeroConnection(sessionToken: string, userId: string, token: TokenResponse, tenant: { tenantId: string; tenantName?: string }) {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const response = await supabaseRequest("/rest/v1/mj_xero_connection?on_conflict=singleton", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      singleton: true,
      tenant_id: tenant.tenantId,
      tenant_name: tenant.tenantName || null,
      access_token_ciphertext: encryptSecret(token.access_token),
      refresh_token_ciphertext: encryptSecret(token.refresh_token),
      expires_at: expiresAt,
      scopes: token.scope || SCOPES,
      connected_by: userId,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  }, sessionToken);
  if (!response.ok) throw new Error("Unable to save Xero connection");
}

export async function getStoredXeroConnection(sessionToken: string) {
  const response = await supabaseRequest("/rest/v1/mj_xero_connection?singleton=eq.true&select=*&limit=1", { method: "GET" }, sessionToken);
  if (!response.ok) throw new Error("Unable to load Xero connection");
  const rows = await response.json() as StoredConnection[];
  return rows[0] || null;
}

async function refreshXeroConnection(sessionToken: string, stored: StoredConnection) {
  const token = await tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: decryptSecret(stored.refresh_token_ciphertext) }));
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const response = await supabaseRequest("/rest/v1/mj_xero_connection?singleton=eq.true", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      access_token_ciphertext: encryptSecret(token.access_token),
      refresh_token_ciphertext: encryptSecret(token.refresh_token),
      expires_at: expiresAt,
      scopes: token.scope || stored.scopes,
      updated_at: new Date().toISOString(),
    }),
  }, sessionToken);
  if (!response.ok) throw new Error("Unable to save refreshed Xero token");
  return { accessToken: token.access_token, tenantId: stored.tenant_id, tenantName: stored.tenant_name };
}

export async function getValidXeroConnection(sessionToken: string) {
  const stored = await getStoredXeroConnection(sessionToken);
  if (!stored) return null;
  if (new Date(stored.expires_at).getTime() <= Date.now() + 120_000) return refreshXeroConnection(sessionToken, stored);
  return { accessToken: decryptSecret(stored.access_token_ciphertext), tenantId: stored.tenant_id, tenantName: stored.tenant_name };
}

export async function disconnectXero(sessionToken: string) {
  const response = await supabaseRequest("/rest/v1/mj_xero_connection?singleton=eq.true", { method: "DELETE" }, sessionToken);
  if (!response.ok) throw new Error("Unable to disconnect Xero");
}

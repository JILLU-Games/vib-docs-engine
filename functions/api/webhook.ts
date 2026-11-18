import type { PagesFunctionContext } from "./health";

export interface WebhookEnv {
  CF_DEPLOY_HOOK_URL?: string;
  DOCS_DEPLOY_HOOK_URL?: string;
  WEBHOOK_SECRET?: string;
  ALLOWED_BRANCHES?: string;
  [key: string]: string | undefined;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

function extractDirectSecret(request: Request): string {
  const directHeader =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("x-gitlab-token") ??
    "";
  if (directHeader.trim()) return directHeader.trim();

  const authHeader = request.headers.get("authorization") ?? "";
  if (/^bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^bearer\s+/i, "").trim();
  }
  return "";
}

function extractHmacSignature(request: Request): string {
  return (
    request.headers.get("x-hub-signature-256") ??
    request.headers.get("x-gitea-signature") ??
    request.headers.get("x-forgejo-signature") ??
    ""
  ).trim();
}

function toLowerHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function verifyHmacSha256(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const normalizedHex = signatureHeader.replace(/^sha256=/i, "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalizedHex)) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedHex = toLowerHex(signature);
  return timingSafeEqualString(expectedHex, normalizedHex);
}

function parseBranchFromPayload(rawBody: string): string | null {
  if (!rawBody.trim()) return null;
  try {
    const parsed = JSON.parse(rawBody) as { ref?: unknown };
    if (typeof parsed?.ref !== "string") return null;
    const ref = parsed.ref.trim();
    if (!ref) return null;
    if (ref.startsWith("refs/heads/")) return ref.slice("refs/heads/".length);
    if (ref.startsWith("refs/")) return "";
    return ref;
  } catch {
    return null;
  }
}

export async function onRequestPost(
  context: PagesFunctionContext<WebhookEnv>,
): Promise<Response> {
  const { request, env } = context;
  const deployHookUrl = (
    env.CF_DEPLOY_HOOK_URL ??
    env.DOCS_DEPLOY_HOOK_URL ??
    ""
  ).trim();

  if (!deployHookUrl) {
    return Response.json(
      {
        ok: false,
        error:
          "CF_DEPLOY_HOOK_URL is not configured in Cloudflare Pages environment variables.",
      },
      { status: 501, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawBody = await request.text();
  const configuredSecret = (env.WEBHOOK_SECRET ?? "").trim();
  if (configuredSecret) {
    const providedSecret = extractDirectSecret(request);
    const hasValidDirectSecret =
      Boolean(providedSecret) &&
      timingSafeEqualString(providedSecret, configuredSecret);

    let hasValidHmacSignature = false;
    if (!hasValidDirectSecret) {
      const signatureHeader = extractHmacSignature(request);
      if (signatureHeader) {
        hasValidHmacSignature = await verifyHmacSha256(
          configuredSecret,
          rawBody,
          signatureHeader,
        );
      }
    }

    if (!hasValidDirectSecret && !hasValidHmacSignature) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized webhook request.",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const allowedBranchesRaw = (env.ALLOWED_BRANCHES ?? "").trim();
  if (allowedBranchesRaw) {
    const allowedBranches = new Set(
      allowedBranchesRaw
        .split(",")
        .map((branch) => branch.trim())
        .filter(Boolean),
    );
    const payloadBranch = parseBranchFromPayload(rawBody);
    if (payloadBranch !== null && !allowedBranches.has(payloadBranch)) {
      return Response.json(
        {
          ok: true,
          triggered: false,
          skipped: true,
          reason: "branch_ignored",
          branch: payloadBranch || null,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const hookResponse = await fetch(deployHookUrl, {
      method: "POST",
      headers: { "User-Agent": "vib-docs-engine-cloudflare-function" },
    });

    if (!hookResponse.ok) {
      return Response.json(
        {
          ok: false,
          error: `Deploy hook returned HTTP ${hookResponse.status}.`,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        ok: true,
        triggered: true,
        timestamp: new Date().toISOString(),
      },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Failed to reach Cloudflare Pages deploy hook.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export function onRequest(): Response {
  return Response.json(
    {
      ok: false,
      error: "Method Not Allowed. Use POST /api/webhook.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    },
  );
}

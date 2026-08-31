import { ZERNIO_BASE, ZERNIO_DEFAULT_PROFILE_ID } from "./types";
import type { ZernioConnectUrlResponse, ZernioSendMessageResponse } from "./types";

const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY;

export type ZernioErrorDetails = {
  existingProfileId?: string;
  [key: string]: unknown;
};

export class ZernioError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: ZernioErrorDetails,
  ) {
    super(message);
    this.name = "ZernioError";
  }
}

async function zernioFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!ZERNIO_API_KEY) throw new ZernioError("ZERNIO_API_KEY not configured");

  const url = `${ZERNIO_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZERNIO_API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
      code?: string;
      details?: ZernioErrorDetails;
    } | null;
    throw new ZernioError(
      body?.error ?? `Zernio API error: ${res.status}`,
      res.status,
      body?.code,
      body?.details && typeof body.details === "object" ? body.details : undefined,
    );
  }

  return res.json();
}

export async function sendZernioMessage(
  conversationId: string,
  accountId: string,
  text: string,
): Promise<ZernioSendMessageResponse> {
  return zernioFetch(`/v1/inbox/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ accountId, message: text }),
  });
}

export async function getZernioConnectUrl(
  platform: string,
  profileId: string,
  redirectUrl: string,
): Promise<ZernioConnectUrlResponse> {
  const params = new URLSearchParams({
    profileId,
    redirect_url: redirectUrl,
  });
  return zernioFetch(`/v1/connect/${platform}?${params.toString()}`);
}

export type ZernioProfile = {
  _id: string;
  name: string;
  description?: string;
};

export async function createZernioProfile(
  name: string,
  description?: string,
): Promise<ZernioProfile> {
  const data = await zernioFetch<ZernioProfile | { profile: ZernioProfile }>(
    "/v1/profiles",
    {
      method: "POST",
      headers: { "Idempotency-Key": name },
      body: JSON.stringify({ name, description }),
    },
  );
  if ("profile" in data && data.profile && typeof data.profile._id === "string") {
    return data.profile;
  }
  return data as ZernioProfile;
}

export async function listZernioProfiles(name?: string): Promise<ZernioProfile[]> {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  const qs = params.toString();
  const data = await zernioFetch<{ profiles: ZernioProfile[] }>(
    `/v1/profiles${qs ? `?${qs}` : ""}`,
  );
  return data.profiles ?? [];
}

export type ZernioAccount = {
  _id: string;
  platform: string;
  username: string;
  displayName: string | null;
};

export async function listZernioAccounts(
  platform?: string,
): Promise<ZernioAccount[]> {
  const params = platform ? `?platform=${platform}` : "";
  const data = await zernioFetch<{ accounts: ZernioAccount[] }>(
    `/v1/accounts${params}`,
  );
  return data.accounts;
}

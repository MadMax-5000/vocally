import { META_GRAPH_VERSION } from "./constants";

type MeAccountsResponse = {
  data: {
    id: string;
    name: string;
    tasks?: string[];
    access_token?: string;
  }[];
};

export async function getUserPages(userAccessToken: string): Promise<MeAccountsResponse["data"]> {
  const u = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`);
  u.searchParams.set("access_token", userAccessToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new Error(`Meta /me/accounts failed: ${JSON.stringify(json)}`);
  }
  if (typeof json !== "object" || !json || !("data" in json) || !Array.isArray((json as any).data)) {
    throw new Error("Meta /me/accounts returned invalid response");
  }
  return (json as MeAccountsResponse).data;
}

export async function getPageAccessToken(
  pageId: string,
  userAccessToken: string,
): Promise<string> {
  const u = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}`);
  u.searchParams.set("fields", "access_token");
  u.searchParams.set("access_token", userAccessToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new Error(`Meta page access_token fetch failed: ${JSON.stringify(json)}`);
  }
  const token =
    typeof json === "object" && json && "access_token" in json
      ? (json as { access_token?: unknown }).access_token
      : null;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Meta page access token missing in response");
  }
  return token;
}

export async function getPageInstagramBusinessAccountId(
  pageId: string,
  pageAccessToken: string,
): Promise<string | null> {
  const u = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}`);
  u.searchParams.set("fields", "instagram_business_account");
  u.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(u.toString(), { method: "GET" });
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new Error(`Meta page instagram_business_account fetch failed: ${JSON.stringify(json)}`);
  }
  const id =
    typeof json === "object" &&
    json &&
    "instagram_business_account" in json &&
    typeof (json as any).instagram_business_account === "object" &&
    (json as any).instagram_business_account &&
    typeof (json as any).instagram_business_account.id === "string"
      ? ((json as any).instagram_business_account.id as string)
      : null;
  return id;
}


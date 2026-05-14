import "server-only";

const API_BASE = "https://api.lemonsqueezy.com/v1/";

function headers(): HeadersInit {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set");
  }
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${key}`,
  };
}

export type LemonVariantAttrs = {
  name: string;
  price: number | null;
  interval: string | null;
  interval_count: number | null;
  is_subscription?: boolean | null;
};

export type LemonVariant = {
  id: string;
  attributes: LemonVariantAttrs;
};

type JsonApiEnvelope<T> = {
  data: T;
};

export async function getVariant(variantId: string): Promise<LemonVariant | null> {
  const res = await fetch(`${API_BASE}variants/${encodeURIComponent(variantId)}`, {
    headers: headers(),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as JsonApiEnvelope<LemonVariant>;
  if (!json.data?.id || !json.data.attributes) return null;
  return json.data;
}

export type CreateCheckoutInput = {
  variantId: string;
  storeId: string;
  clerkOrgId: string;
  clerkUserId: string;
  redirectUrl: string;
  email?: string | null;
  name?: string | null;
};

export async function createCheckout(input: CreateCheckoutInput): Promise<string> {
  const storeId = input.storeId.trim();
  const variantId = input.variantId.trim();
  if (!storeId || !variantId) {
    throw new Error("storeId and variantId are required");
  }

  const checkoutData: Record<string, unknown> = {
    custom: {
      clerk_org_id: input.clerkOrgId,
      clerk_user_id: input.clerkUserId,
    },
  };
  if (input.email) checkoutData.email = input.email;
  if (input.name) checkoutData.name = input.name;

  const testMode = process.env.LEMONSQUEEZY_TEST_MODE === "true";

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        test_mode: testMode,
        checkout_data: checkoutData,
        product_options: {
          enabled_variants: (() => {
            const n = Number(variantId);
            return Number.isFinite(n) ? [n] : [variantId];
          })(),
          redirect_url: input.redirectUrl,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const res = await fetch(`${API_BASE}checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    errors?: { detail?: string }[];
    data?: { attributes?: { url?: string } };
  };

  if (!res.ok) {
    const msg = json.errors?.[0]?.detail ?? res.statusText;
    throw new Error(`Lemon Squeezy checkout failed: ${msg}`);
  }

  const url = json.data?.attributes?.url;
  if (!url) {
    throw new Error("Lemon Squeezy checkout response missing url");
  }
  return url;
}

import { logServerError } from "@/lib/logger";

export type VapiTransferDestination = {
  type: "number";
  number: string;
};

function resolveControlEndpoint(controlUrl: string): string {
  const trimmed = controlUrl.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/control")) {
    return trimmed;
  }
  return `${trimmed}/control`;
}

export async function executeVapiTransfer(params: {
  controlUrl: string;
  handoffPhone: string;
  message: string;
}): Promise<boolean> {
  const endpoint = resolveControlEndpoint(params.controlUrl);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "transfer",
        destination: {
          type: "number",
          number: params.handoffPhone,
        } satisfies VapiTransferDestination,
        content: params.message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logServerError("vapi.transfer_failed", {
        status: res.status,
        body: body.slice(0, 500),
      });
      return false;
    }

    return true;
  } catch (err) {
    logServerError("vapi.transfer_network_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export function getVapiControlUrl(message: {
  call?: { monitor?: { controlUrl?: string } };
}): string | null {
  const controlUrl = message.call?.monitor?.controlUrl;
  return typeof controlUrl === "string" && controlUrl.trim().length > 0
    ? controlUrl.trim()
    : null;
}

export const HOSTAWAY_CHANNEL_IDS = {
  2018: "airbnb",
  2005: "bookingcom",
} as const;

export type HostawayChannel = (typeof HOSTAWAY_CHANNEL_IDS)[keyof typeof HOSTAWAY_CHANNEL_IDS];

export const HOSTAWAY_SUPPORTED_CHANNELS: Array<{
  id: HostawayChannel;
  label: string;
  channelId: number;
}> = [
  { id: "airbnb", label: "Airbnb", channelId: 2018 },
  { id: "bookingcom", label: "Booking.com", channelId: 2005 },
];

export function hostawayChannelLabel(channel: HostawayChannel): string {
  return HOSTAWAY_SUPPORTED_CHANNELS.find((c) => c.id === channel)?.label ?? channel;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves the booking channel of a Hostaway reservation. Only Airbnb and
 * Booking.com are handled: unified messaging for other channels stays untouched.
 */
export function resolveHostawayChannel(input: {
  channelId?: unknown;
  channelName?: unknown;
}): HostawayChannel | null {
  const numericId =
    typeof input.channelId === "number"
      ? input.channelId
      : typeof input.channelId === "string" && input.channelId.trim() !== ""
        ? Number.parseInt(input.channelId, 10)
        : null;

  if (numericId !== null && Number.isFinite(numericId)) {
    const mapped = HOSTAWAY_CHANNEL_IDS[numericId as keyof typeof HOSTAWAY_CHANNEL_IDS];
    if (mapped) return mapped;
  }

  if (typeof input.channelName === "string") {
    const name = normalizeName(input.channelName);
    if (name.includes("airbnb")) return "airbnb";
    if (name.includes("booking")) return "bookingcom";
  }

  return null;
}

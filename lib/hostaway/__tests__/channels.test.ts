import { describe, expect, it } from "vitest";

import { hostawayChannelLabel, resolveHostawayChannel } from "../channels";

describe("resolveHostawayChannel", () => {
  it("maps official Airbnb and Booking.com channel IDs", () => {
    expect(resolveHostawayChannel({ channelId: 2018 })).toBe("airbnb");
    expect(resolveHostawayChannel({ channelId: "2005" })).toBe("bookingcom");
  });

  it("falls back to channel names when the ID is missing", () => {
    expect(resolveHostawayChannel({ channelName: "airbnbOfficial" })).toBe("airbnb");
    expect(resolveHostawayChannel({ channelName: "Booking.com" })).toBe("bookingcom");
  });

  it("ignores channels outside the supported scope", () => {
    expect(resolveHostawayChannel({ channelId: 2002, channelName: "homeaway" })).toBeNull();
    expect(resolveHostawayChannel({ channelId: 2000, channelName: "direct" })).toBeNull();
    expect(resolveHostawayChannel({ channelName: "Expedia" })).toBeNull();
    expect(resolveHostawayChannel({})).toBeNull();
  });

  it("labels supported channels", () => {
    expect(hostawayChannelLabel("airbnb")).toBe("Airbnb");
    expect(hostawayChannelLabel("bookingcom")).toBe("Booking.com");
  });
});

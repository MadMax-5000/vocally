import { describe, expect, it } from "vitest";

import {
  getDeployCatalogEntry,
  INTEGRATION_DEPLOYMENTS,
} from "../deploy-catalog";

describe("Hostaway deployment cards", () => {
  it("shows Airbnb and Booking.com as separate cards", () => {
    expect(getDeployCatalogEntry("airbnb")).toMatchObject({
      title: "Airbnb",
      iconSrc: "/svg/airbnb.svg",
      channelType: "HOSTAWAY",
    });
    expect(getDeployCatalogEntry("booking-com")).toMatchObject({
      title: "Booking.com",
      iconSrc: "/svg/booking-com.svg",
      channelType: "HOSTAWAY",
    });
  });

  it("does not expose a generic Hostaway card", () => {
    expect(getDeployCatalogEntry("hostaway")).toBeUndefined();
    expect(INTEGRATION_DEPLOYMENTS.some((entry) => entry.id === "hostaway")).toBe(
      false,
    );
  });
});

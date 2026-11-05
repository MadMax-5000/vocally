import type { HostawayChannel } from "./channels";
import { hostawayChannelLabel } from "./channels";
import type {
  HostawayListing,
  HostawayReservation,
} from "./types";

const MAX_CONTEXT_CHARS = 4_000;

function line(label: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return `${label}: ${text}`;
}

function truncate(text: string, max = MAX_CONTEXT_CHARS): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function buildPropertyContext(listing: HostawayListing | null): string | null {
  if (!listing) return null;

  const name =
    listing.name ?? listing.externalListingName ?? listing.internalListingName ?? null;
  const checkIn =
    listing.checkInTimeStart !== null && listing.checkInTimeStart !== undefined
      ? `${listing.checkInTimeStart}:00${listing.checkInTimeEnd ? `–${listing.checkInTimeEnd}:00` : ""}`
      : null;

  const parts = [
    line("Property", name),
    line("Address", listing.publicAddress ?? listing.address),
    line("Capacity", listing.personCapacity ? `${listing.personCapacity} guests` : null),
    line(
      "Bedrooms / bathrooms",
      listing.bedroomsNumber || listing.bathroomsNumber
        ? `${listing.bedroomsNumber ?? "?"} / ${listing.bathroomsNumber ?? "?"}`
        : null,
    ),
    line("Check-in window", checkIn),
    line("Check-out time", listing.checkOutTime ? `${listing.checkOutTime}:00` : null),
    line("Description", listing.description),
    line("House rules", listing.houseRules),
    line("Key pickup", listing.keyPickup),
    line("Special instructions", listing.specialInstruction),
  ].filter((part): part is string => part !== null);

  if (parts.length === 0) return null;
  return truncate(parts.join("\n"));
}

export function buildHostawayAiContext(input: {
  channel: HostawayChannel;
  reservation: HostawayReservation | null;
  propertyContext: string | null;
}): string {
  const { channel, reservation, propertyContext } = input;
  const guestName =
    reservation?.guestName ??
    [reservation?.guestFirstName, reservation?.guestLastName]
      .filter(Boolean)
      .join(" ") ??
    null;

  const reservationLines = [
    line("Booking channel", hostawayChannelLabel(channel)),
    line("Guest name", guestName || null),
    line("Reservation number", reservation?.confirmationCode ?? reservation?.reservationId),
    line("Stay", reservation?.arrivalDate && reservation?.departureDate
      ? `${reservation.arrivalDate} → ${reservation.departureDate}`
      : null),
    line("Nights", reservation?.nights),
    line("Guests", reservation?.numberOfGuests),
    line("Reservation status", reservation?.status),
  ].filter((part): part is string => part !== null);

  return [
    "## Hostaway guest conversation",
    "This conversation happens inside an Airbnb or Booking.com message thread through Hostaway.",
    "Reply only from the provided property knowledge and reservation details. Never invent policies, prices, or availability.",
    "Do not mention Hostaway, internal tooling, or this context block.",
    ...reservationLines,
    propertyContext ? `\n### Property knowledge\n${propertyContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

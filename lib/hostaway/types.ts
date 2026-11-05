export const HOSTAWAY_API_BASE = "https://api.hostaway.com/v1";

export type HostawayTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
};

export type HostawayEnvelope<T> = {
  status: "success" | "fail";
  result: T;
  message?: string;
};

export type HostawayReservation = {
  id?: number | string;
  listingMapId?: number | string;
  listingName?: string;
  channelId?: number | string | null;
  channelName?: string | null;
  reservationId?: string;
  hostawayReservationId?: number | string;
  channelReservationId?: string;
  guestName?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  arrivalDate?: string | null;
  departureDate?: string | null;
  nights?: number | null;
  numberOfGuests?: number | null;
  status?: string | null;
  confirmationCode?: string | null;
};

export type HostawayConversationMessage = {
  id: number | string;
  conversationId?: number | string;
  reservationId?: number | string | null;
  listingMapId?: number | string | null;
  body?: string | null;
  communicationType?: string | null;
  status?: string | null;
  isIncoming?: number | string | boolean | null;
  sentUsingHostaway?: number | string | boolean | null;
  date?: string | null;
  sentChannelDate?: string | null;
  insertedOn?: string | null;
};

export type HostawayConversation = {
  id: number | string;
  listingMapId?: number | string | null;
  reservationId?: number | string | null;
  type?: string | null;
  recipientName?: string | null;
  guestName?: string | null;
  conversationMessages?: HostawayConversationMessage[];
  Reservation?: HostawayReservation | null;
  reservation?: HostawayReservation | null;
  [key: string]: unknown;
};

export type HostawayListing = {
  id: number | string;
  name?: string | null;
  internalListingName?: string | null;
  externalListingName?: string | null;
  description?: string | null;
  houseRules?: string | null;
  keyPickup?: string | null;
  specialInstruction?: string | null;
  address?: string | null;
  publicAddress?: string | null;
  city?: string | null;
  country?: string | null;
  checkInTimeStart?: number | null;
  checkInTimeEnd?: number | null;
  checkOutTime?: number | null;
  personCapacity?: number | null;
  bedroomsNumber?: number | null;
  bathroomsNumber?: number | null;
  timeZoneName?: string | null;
  [key: string]: unknown;
};

export type HostawayWebhook = {
  id: number | string;
  isEnabled?: number | string | boolean;
  url?: string;
  login?: string | null;
  password?: string | null;
  alertingEmailAddress?: string | null;
};

export type ParsedHostawayWebhook = {
  event: string | null;
  objectType: string | null;
  conversationId: string | null;
  messageId: string | null;
  reservationId: string | null;
  accountId: string | null;
  inlineBody: string | null;
  inlineIsIncoming: boolean | null;
};

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/** Top-level payload plus the containers Hostaway uses in unified webhooks. */
function candidateRecords(payload: unknown): RecordValue[] {
  const root = asRecord(payload);
  if (!root) return [];

  const records: RecordValue[] = [root];
  for (const key of [
    "data",
    "payload",
    "conversation",
    "conversationMessage",
    "message",
    "reservation",
    "Reservation",
  ]) {
    const nested = asRecord(root[key]);
    if (nested) records.push(nested);
  }
  return records;
}

function pickString(records: RecordValue[], keys: string[]): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = asString(record[key]);
      if (value) return value;
    }
  }
  return null;
}

function pickBoolean(records: RecordValue[], keys: string[]): boolean | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (value === true || value === 1 || value === "1" || value === "true") {
        return true;
      }
      if (value === false || value === 0 || value === "0" || value === "false") {
        return false;
      }
    }
  }
  return null;
}

export function parseHostawayWebhook(payload: unknown): ParsedHostawayWebhook {
  const records = candidateRecords(payload);
  const root = asRecord(payload);

  const objectType =
    asString(root?.object) ??
    asString(root?.objectType) ??
    asString(root?.object_type);

  const event =
    asString(root?.event) ??
    asString(root?.eventType) ??
    asString(root?.type) ??
    pickString(records, ["event"]);

  const conversationRecord = asRecord(root?.conversation);
  const messageRecord =
    asRecord(root?.conversationMessage) ?? asRecord(root?.message);
  const dataRecord = asRecord(root?.data);

  const conversationId =
    pickString(records, ["conversationId", "conversation_id"]) ??
    asString(conversationRecord?.id) ??
    asString(messageRecord?.conversationId);

  const normalizedObject = (objectType ?? "").toLowerCase();
  const messageId =
    pickString(records, ["messageId", "message_id", "conversationMessageId"]) ??
    (normalizedObject === "conversationmessage"
      ? asString(root?.objectId) ?? asString(root?.object_id)
      : null) ??
    asString(messageRecord?.id);

  return {
    event,
    objectType,
    conversationId,
    messageId,
    reservationId: pickString(records, [
      "reservationId",
      "reservation_id",
      "reservationID",
    ]),
    accountId: pickString(records, ["accountId", "account_id"]),
    inlineBody:
      pickString(
        [messageRecord, dataRecord, root].filter(
          (record): record is RecordValue => record !== null,
        ),
        ["body", "message", "text", "content"],
      ) ?? null,
    inlineIsIncoming: pickBoolean(
      [messageRecord, dataRecord, root].filter(
        (record): record is RecordValue => record !== null,
      ),
      ["isIncoming", "is_incoming"],
    ),
  };
}

/**
 * Hostaway unified webhooks deliver every supported event. Only new inbound
 * conversation messages should reach the AI; sent/updated/read events are ignored.
 */
export function isHostawayMessageEvent(parsed: ParsedHostawayWebhook): boolean {
  const event = (parsed.event ?? "").toLowerCase();
  const object = (parsed.objectType ?? "").toLowerCase();

  const eventLooksReceived =
    event.includes("message") &&
    (event.includes("received") || event.includes("created") || event.includes("new")) &&
    !event.includes("sent") &&
    !event.includes("updated") &&
    !event.includes("read") &&
    !event.includes("failed");

  if (eventLooksReceived) return true;

  if (object === "conversationmessage") {
    if (!event) return true;
    return (
      (event.includes("received") || event.includes("created") || event.includes("new")) &&
      !event.includes("sent") &&
      !event.includes("updated")
    );
  }

  return false;
}

export function hostawayMessageKey(
  parsed: ParsedHostawayWebhook,
  conversationId: string,
  fallback: string,
): string {
  const account = parsed.accountId ?? "unknown";
  if (parsed.messageId) return `${account}:${parsed.messageId}`;
  return `${account}:${conversationId}:${fallback}`;
}

export function getTwilioAccountSid(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  if (!sid) throw new Error("TWILIO_ACCOUNT_SID is not configured");
  return sid;
}

export function getTwilioAuthToken(): string {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) throw new Error("TWILIO_AUTH_TOKEN is not configured");
  return token;
}

export function getTwilioWhatsappNumber(): string {
  const num = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!num) throw new Error("TWILIO_WHATSAPP_NUMBER is not configured");
  return num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
}

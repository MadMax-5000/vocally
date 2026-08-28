export function recordingConsentLine(language: string): string {
  const code = language.toLowerCase();
  if (code === "ar" || code === "ary" || code === "arabic" || code === "darija") {
    return "قد يتم تسجيل هذه المكالمة.";
  }
  if (code === "fr" || code === "french") {
    return "Cet appel peut être enregistré.";
  }
  return "This call may be recorded.";
}

export function prependRecordingConsent(
  greeting: string,
  enabled: boolean,
  language: string,
): string {
  if (!enabled) return greeting;
  const consent = recordingConsentLine(language);
  const trimmed = greeting.trim();
  if (!trimmed) return consent;
  if (trimmed.startsWith(consent)) return trimmed;
  return `${consent} ${trimmed}`;
}

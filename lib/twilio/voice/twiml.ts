function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildWelcomeTwiML(welcomeMessage: string, gatherUrl: string): string {
  const msg = escapeXml(welcomeMessage);
  const url = escapeXml(gatherUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" timeout="3" speechTimeout="auto" action="${url}" method="POST">
    <Say>${msg}</Say>
  </Gather>
  <Say>We didn&amp;apos;t receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function buildResponseTwiML(
  botMessage: string,
  gatherUrl: string,
): string {
  const msg = escapeXml(botMessage);
  const url = escapeXml(gatherUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${msg}</Say>
  <Gather input="speech dtmf" timeout="3" speechTimeout="auto" action="${url}" method="POST">
    <Say>${msg}</Say>
  </Gather>
  <Say>We didn&amp;apos;t receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function buildEscalationTwiML(escalationMessage: string): string {
  const msg = escapeXml(escalationMessage);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${msg}</Say>
  <Hangup/>
</Response>`;
}

export function buildGoodbyeTwiML(message: string): string {
  const msg = escapeXml(message);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${msg}</Say>
  <Hangup/>
</Response>`;
}

export function buildNoAgentTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This number is not configured for voice service. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function buildRepromptTwiML(message: string, gatherUrl: string): string {
  const msg = escapeXml(message);
  const url = escapeXml(gatherUrl);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${msg}</Say>
  <Gather input="speech dtmf" timeout="3" speechTimeout="auto" action="${url}" method="POST">
    <Say>Please speak your response.</Say>
  </Gather>
  <Say>We didn&amp;apos;t receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function buildDialTwiML(
  handoffPhone: string,
  message?: string,
): string {
  const phone = escapeXml(handoffPhone);
  const say = message
    ? `<Say>${escapeXml(message)}</Say>\n  `
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${say}<Dial>${phone}</Dial>
</Response>`;
}

export function buildStreamWelcomeTwiML(
  welcomeMessage: string,
  wsUrl: string,
  orgId: string,
  agentId: string,
  sessionId: string,
): string {
  const url = escapeXml(wsUrl);
  const org = escapeXml(orgId);
  const agent = escapeXml(agentId);
  const sess = escapeXml(sessionId);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${url}">
      <Parameter name="orgId" value="${org}" />
      <Parameter name="agentId" value="${agent}" />
      <Parameter name="sessionId" value="${sess}" />
    </Stream>
  </Connect>
</Response>`;
}

import { AgentChannelType } from "@prisma/client";

export const CHANNEL_META: {
  value: AgentChannelType;
  label: string;
  iconSrc: string;
}[] = [
  {
    value: "WEB_CHAT",
    label: "Web chat",
    iconSrc: "/svg/chat.svg",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    iconSrc: "/svg/whatsapp-icon.svg",
  },
  {
    value: "VOICE_CALLS",
    label: "Voice calls",
    iconSrc: "/svg/call.svg",
  },
  {
    value: "MESSENGER",
    label: "Messenger",
    iconSrc: "/svg/messenger.svg",
  },
  {
    value: "INSTAGRAM",
    label: "Instagram",
    iconSrc: "/svg/instagram-icon.svg",
  },
  {
    value: "SLACK",
    label: "Slack",
    iconSrc: "/svg/slack.svg",
  },
  {
    value: "EMAIL",
    label: "Email",
    iconSrc: "/svg/gmail.svg",
  },
  {
    value: "SMS",
    label: "SMS",
    iconSrc: "/svg/send.svg",
  },
];

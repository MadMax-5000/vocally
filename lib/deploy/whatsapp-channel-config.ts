import { z } from "zod";

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const whatsappChannelConfigSchema = z.object({
  welcomeMessage: z.string().max(1000).optional(),
  awayMessage: z.string().max(1000).optional(),
  businessHoursEnabled: z.boolean().optional(),
  timezone: z.string().max(64).optional(),
  businessHours: z
    .object({
      monday: dayScheduleSchema,
      tuesday: dayScheduleSchema,
      wednesday: dayScheduleSchema,
      thursday: dayScheduleSchema,
      friday: dayScheduleSchema,
      saturday: dayScheduleSchema,
      sunday: dayScheduleSchema,
    })
    .optional(),
  handoffEnabled: z.boolean().optional(),
  profileAbout: z.string().max(139).optional(),
  profileDescription: z.string().max(512).optional(),
});

export type WhatsappChannelConfig = z.infer<typeof whatsappChannelConfigSchema>;

const defaultDay = { enabled: true, start: "09:00", end: "18:00" };

export const DEFAULT_WHATSAPP_CHANNEL_CONFIG: WhatsappChannelConfig = {
  welcomeMessage: "",
  awayMessage: "We're currently unavailable. We'll reply as soon as we're back.",
  businessHoursEnabled: false,
  timezone: "Africa/Casablanca",
  businessHours: {
    monday: defaultDay,
    tuesday: defaultDay,
    wednesday: defaultDay,
    thursday: defaultDay,
    friday: defaultDay,
    saturday: { enabled: false, start: "09:00", end: "18:00" },
    sunday: { enabled: false, start: "09:00", end: "18:00" },
  },
  handoffEnabled: true,
  profileAbout: "",
  profileDescription: "",
};

export function parseWhatsappChannelConfig(
  raw: unknown,
): WhatsappChannelConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_WHATSAPP_CHANNEL_CONFIG };
  }
  const parsed = whatsappChannelConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...DEFAULT_WHATSAPP_CHANNEL_CONFIG, ...(raw as WhatsappChannelConfig) };
  }
  return { ...DEFAULT_WHATSAPP_CHANNEL_CONFIG, ...parsed.data };
}

export function isWithinBusinessHours(
  config: WhatsappChannelConfig,
  now = new Date(),
): boolean {
  if (!config.businessHoursEnabled || !config.businessHours) return true;

  const tz = config.timezone ?? "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const current = `${hour}:${minute}`;

  if (!weekday) return true;
  const dayKey = weekday as keyof NonNullable<WhatsappChannelConfig["businessHours"]>;
  const schedule = config.businessHours[dayKey];
  if (!schedule?.enabled) return false;

  return current >= schedule.start && current <= schedule.end;
}

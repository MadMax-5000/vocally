import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email/send";
import { BRAND_EMAILS } from "@/lib/constants/brand";

const companySizeSchema = z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]);

const salesContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40),
  companySize: z.union([companySizeSchema, z.literal("")]),
  message: z.string().trim().min(10).max(4000),
  locale: z.string().trim().max(8).optional(),
  website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = salesContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { name, email, company, phone, companySize, message, locale, website } = parsed.data;

    if (website) {
      return NextResponse.json({ success: true });
    }

    const companySizeLine = companySize ? `Company size: ${companySize}` : "Company size: Not provided";
    const phoneLine = phone ? `Phone: ${phone}` : "Phone: Not provided";
    const localeLine = locale ? `Locale: ${locale}` : "Locale: Not provided";

    const textBody = [
      "New enterprise sales inquiry",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company}`,
      phoneLine,
      companySizeLine,
      localeLine,
      "",
      "Message:",
      message,
      "",
      `Submitted at: ${new Date().toISOString()}`,
    ].join("\n");

    await sendEmail({
      to: BRAND_EMAILS.contact,
      subject: `[Enterprise] ${company} — ${name}`,
      body: textBody,
      replyTo: email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

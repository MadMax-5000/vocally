import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transcribeAudio } from "@/lib/voice/stt";

const requestSchema = z.object({
  audio: z.string().min(1),
  format: z.string().min(1),
  language: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { audio, format, language } = parsed.data;
    const result = await transcribeAudio(audio, format, language);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

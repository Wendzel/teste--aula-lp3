import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { setAnalysis } from "@/lib/store";
import { runPipeline } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const id = randomUUID();

  setAnalysis(id, {
    id,
    url,
    step: "pending",
    createdAt: Date.now(),
  });

  // Run pipeline in background (no await)
  runPipeline(id, url).catch(console.error);

  return NextResponse.json({ id });
}

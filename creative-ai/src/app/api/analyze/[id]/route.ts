import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analysis = getAnalysis(id);

  if (!analysis) {
    return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
  }

  return NextResponse.json(analysis);
}

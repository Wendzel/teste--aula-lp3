import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { store } from '@/lib/store';
import { runPipeline } from '@/lib/pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url: string };
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const id = randomUUID();

    store.set(id, {
      id,
      status: 'pending',
      step: 0,
      totalSteps: 5,
      stepLabel: 'Starting analysis...',
      url,
    });

    // Run pipeline async
    runPipeline(id, url).catch(console.error);

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

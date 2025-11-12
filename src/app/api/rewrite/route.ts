import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const HF_ENDPOINT =
  'https://router.huggingface.co/hf-inference/models/VietAI/vit5-base-vietnews-summarization';

// GET handler - API info
export async function GET() {
  return NextResponse.json({
    message: 'API /api/rewrite is working!',
    methods: ['POST'],
  });
}

// POST handler - Rewrite/summarize article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId } = body as { articleId?: string };

    // Validate articleId
    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'articleId is required' },
        { status: 400 }
      );
    }

    // Check if summary already exists
    const existingRewrite = await db.rewrite.findUnique({
      where: { articleId },
    });

    if (existingRewrite) {
      return NextResponse.json(
        {
          success: true,
          articleId,
          summary: existingRewrite.content,
          rewrittenContent: existingRewrite.content,
          timestamp: existingRewrite.createdAt.toISOString(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch article from database
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { title: true, description: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Prepare text for summarization (title + description)
    const text = `${article.title}. ${article.description || ''}`.trim();

    if (!text) {
      return NextResponse.json({ error: 'Article has no content to summarize' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'HF_API_KEY not configured' }, { status: 500 });
    }

    // Helper to call HF API with timeout
    const callHF = async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20_000);
      try {
        const r = await fetch(HF_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        return r;
      } catch (e) {
        clearTimeout(t);
        throw e;
      }
    };

    let response = await callHF();
    if (response.status === 503) {
      await new Promise((r) => setTimeout(r, 15_000)); // warm-up
      response = await callHF();
    }

    if (!response.ok) {
      const err = await response.text();
      console.error('HF error:', err);
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: response.status });
    }

    const data = await response.json();
    let summary = '';
    if (Array.isArray(data) && data.length) {
      summary = data[0].summary_text || data[0].generated_text || '';
    } else if (data?.summary_text) {
      summary = data.summary_text;
    } else if (data?.generated_text) {
      summary = data.generated_text;
    }

    if (!summary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    // Save to Rewrite table
    const saved = await db.rewrite.upsert({
      where: { articleId },
      update: { content: summary },
      create: { articleId, content: summary },
      select: { id: true, articleId: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      {
        success: true,
        articleId,
        summary,
        rewrittenContent: summary,
        timestamp: saved.createdAt.toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('rewrite API error:', err);
    const isAbort = err?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: isAbort ? 'Summarization timed out' : 'Internal server error',
      },
      { status: isAbort ? 504 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

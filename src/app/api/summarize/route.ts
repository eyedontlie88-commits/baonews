import { NextRequest, NextResponse } from 'next/server';

const HF_MODEL = 'VietAI/vit5-base-vietnews-summarization'; // base warm-up nhanh hơn; có thể đổi sang vit5-large khi ổn
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body ?? {};

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'HF_API_KEY not configured' }, { status: 500 });
    }

    // ---- Call Hugging Face API (timeout + retry if 503) ----
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000); // 20s

    let response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // If model is loading (503), wait then retry once
    if (response.status === 503) {
      await new Promise((r) => setTimeout(r, 15_000)); // wait 15s
      response = await fetch(HF_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Hugging Face API error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: response.status });
    }

    const data = await response.json();

    // Parse result (HF router can return summary_text or generated_text)
    let summary = '';
    if (Array.isArray(data) && data.length > 0) {
      summary = data[0]?.summary_text || data[0]?.generated_text || '';
    } else if (data?.summary_text) {
      summary = data.summary_text;
    } else if (data?.generated_text) {
      summary = data.generated_text;
    }

    if (!summary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    return NextResponse.json(
      { summary },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('Error in summarize API:', err?.message || err);
    // Distinguish abort timeout
    if (err?.name === 'AbortError') {
      return NextResponse.json({ error: 'Summarization timed out' }, { status: 504 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

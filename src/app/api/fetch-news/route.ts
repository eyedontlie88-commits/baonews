import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { db } from '@/lib/db';

const parser = new Parser();

const FEEDS = [
  { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VnExpress' },
  { url: 'https://vietnamnet.vn/rss/tin-moi-nhat.rss', source: 'VietnamNet' },
  { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'DanTri' },
];

async function fetchNews() {
  let insertedCount = 0;

  for (const feed of FEEDS) {
    try {
      const feedData = await parser.parseURL(feed.url);
      
      for (const item of feedData.items) {
        if (!item.link) continue;

        // Check if article already exists
        const existing = await db.article.findUnique({
          where: { url: item.link },
        });

        // Skip if already exists
        if (existing) continue;

        // Extract image URL from content or enclosure
        let imageUrl = null;
        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }

        // Parse published date
        const publishedAt = item.pubDate ? new Date(item.pubDate) : null;

        // Insert new article
        await db.article.create({
          data: {
            url: item.link,
            title: item.title || '',
            description: item.contentSnippet || item.content || null,
            imageUrl,
            source: feed.source,
            category: null,
            publishedAt,
          },
        });

        insertedCount++;
      }
    } catch (feedError) {
      console.error(`Error fetching feed ${feed.url}:`, feedError);
    }
  }

  return insertedCount;
}

export async function GET() {
  try {
    const inserted = await fetchNews();

    return NextResponse.json(
      {
        success: true,
        inserted,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in fetch-news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export async function POST() {
  try {
    const inserted = await fetchNews();

    return NextResponse.json(
      {
        success: true,
        inserted,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in fetch-news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

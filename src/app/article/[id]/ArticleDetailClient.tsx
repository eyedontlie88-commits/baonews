'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SummaryBox } from '@/components/SummaryBox';

interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: Date | null;
}

export function ArticleDetailClient({ 
  article, 
  initialSummary 
}: { 
  article: Article; 
  initialSummary: string | null;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const text = article.description || article.title;
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, text }),
      });
      
      const data = await response.json();
      if (response.ok && data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error summarizing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Quay lại trang chủ
        </Link>
        <h1 className="text-2xl font-bold leading-snug">{article.title}</h1>
        <div className="text-sm text-slate-500">
          Nguồn: <span className="font-medium">{article.source}</span>
          {article.publishedAt ? (
            <> • {new Date(article.publishedAt).toLocaleString('vi-VN')}</>
          ) : null}
        </div>
      </div>

      {article.imageUrl ? (
        <div className="mb-6 overflow-hidden rounded-xl border">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-8 space-y-3">
        {article.description ? (
          <p className="text-base leading-relaxed text-slate-800">{article.description}</p>
        ) : null}
        <div className="flex gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
          >
            📖 Đọc bài gốc
          </a>
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700 disabled:bg-gray-400"
          >
            {loading ? '⏳ Đang tóm tắt...' : '🧠 Tóm tắt AI'}
          </button>
        </div>
      </div>

      <SummaryBox content={summary} onRefresh={handleSummarize} />
    </div>
  );
}

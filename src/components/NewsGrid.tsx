'use client';

import { useEffect, useState } from 'react';

interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

interface SummaryState {
  [articleId: string]: {
    loading: boolean;
    summary: string | null;
    error: string | null;
  };
}

export default function NewsGrid() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<SummaryState>({});

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        
        if (data.success) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  };

  const handleSummarize = async (article: Article) => {
    // Set loading state
    setSummaries((prev) => ({
      ...prev,
      [article.id]: { loading: true, summary: null, error: null },
    }));

    try {
      const textToSummarize = article.description || article.title;
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSummarize }),
      });

      const data = await response.json();

      if (response.ok && data.summary) {
        setSummaries((prev) => ({
          ...prev,
          [article.id]: { loading: false, summary: data.summary, error: null },
        }));
      } else {
        setSummaries((prev) => ({
          ...prev,
          [article.id]: {
            loading: false,
            summary: null,
            error: data.error || 'Không thể tạo tóm tắt',
          },
        }));
      }
    } catch (error) {
      setSummaries((prev) => ({
        ...prev,
        [article.id]: {
          loading: false,
          summary: null,
          error: 'Lỗi kết nối API',
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-600">Đang tải tin tức...</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <p className="text-gray-700 mb-4">
          Chưa có bài viết nào. Hãy cập nhật RSS.
        </p>
        <a
          href="/admin"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Đi tới trang Admin
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <div
          key={article.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Image */}
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          <div className="p-4">
            {/* Badge + Date */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                {article.source}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(article.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
              {article.title}
            </h3>

            {/* Description */}
            {article.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {article.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm px-3 py-2 rounded transition-colors"
                onClick={() => handleSummarize(article)}
                disabled={summaries[article.id]?.loading}
              >
                {summaries[article.id]?.loading ? '⏳ Đang tóm tắt...' : '🧠 Tóm tắt AI'}
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded text-center transition-colors"
              >
                🔗 Đọc bài gốc
              </a>
            </div>

            {/* Summary Box */}
            {summaries[article.id]?.summary && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-green-800">
                    ✨ Tóm tắt AI:
                  </h4>
                  <button
                    onClick={() => handleSummarize(article)}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Làm mới
                  </button>
                </div>
                <p className="text-sm text-gray-700">
                  {summaries[article.id].summary}
                </p>
              </div>
            )}

            {/* Error Box */}
            {summaries[article.id]?.error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ❌ {summaries[article.id].error}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

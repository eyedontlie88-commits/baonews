'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);

  const handleFetchNews = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/fetch-news', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Đã thêm ${data.inserted} bài mới!`);
        window.location.reload();
      } else {
        alert('Có lỗi xảy ra khi cập nhật RSS');
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Quản lý tin tức</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleFetchNews}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>{loading ? 'Đang cập nhật...' : 'Cập nhật RSS'}</span>
          </button>

          {loading && (
            <div className="mt-4 text-center text-gray-600">
              <p>⏳ Đang fetch RSS feeds... Vui lòng đợi</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Quay về trang chủ
          </a>
        </div>
      </div>
    </main>
  );
}

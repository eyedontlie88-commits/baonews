import NewsGrid from '@/components/NewsGrid';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            📰 Tin Tức Mới Nhất
          </h1>
          <p className="text-gray-600">
            Tổng hợp tin tức từ VnExpress, VietnamNet, DanTri
          </p>
        </div>
        
        <NewsGrid />
      </div>
    </main>
  );
}

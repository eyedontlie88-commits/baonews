export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h2 className="mb-2 text-2xl font-semibold">Không tìm thấy bài viết</h2>
      <p className="text-slate-600">Bài viết có thể đã bị xoá hoặc chưa tồn tại.</p>
      <a href="/" className="mt-6 inline-block rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-900">
        ← Về trang chủ
      </a>
    </div>
  );
}

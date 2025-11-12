# Fix Backend API - /api/rewrite

## ✅ Hoàn thành

### Vấn đề ban đầu
- Mobile app gọi POST `/api/rewrite` với body `{ articleId }`
- Backend không có route này → trả về **405 Method Not Allowed**
- Route có sẵn là `/api/summarize` nhưng yêu cầu cả `articleId` và `text`

### Giải pháp
✅ **Đã tạo route mới:** `src/app/api/rewrite/route.ts`

## Chi tiết route /api/rewrite

### Input
```json
POST /api/rewrite
Content-Type: application/json

{
  "articleId": "string"
}
```

### Logic
1. **Validate articleId** - Bắt buộc phải có
2. **Check cache** - Kiểm tra xem đã có tóm tắt trong DB chưa (bảng Rewrite)
   - Nếu có → trả về ngay (performance optimization)
3. **Fetch article** - Lấy article từ DB theo articleId
   - Nếu không tồn tại → 404 Not Found
4. **Prepare text** - Ghép `title + description` để tóm tắt
5. **Call HuggingFace API** - Gọi model VietAI/vit5-base-vietnews-summarization
   - Timeout: 20 giây
   - Retry nếu model đang cold start (503)
6. **Parse response** - Lấy summary từ response
7. **Save to DB** - Lưu vào bảng Rewrite (upsert)
8. **Return summary**

### Output (Success)
```json
{
  "summary": "Nội dung tóm tắt...",
  "saved": {
    "id": "rewrite_id",
    "articleId": "article_id",
    "content": "Nội dung tóm tắt...",
    "createdAt": "2025-11-12T10:56:00Z"
  }
}
```

### Error Responses
- **400 Bad Request** - Thiếu articleId hoặc article không có nội dung
- **404 Not Found** - Article không tồn tại
- **500 Internal Server Error** - HF_API_KEY chưa config hoặc lỗi khác
- **504 Gateway Timeout** - HuggingFace API timeout

## Tính năng

### 1. Cache tự động
- Lần đầu tiên tóm tắt một bài viết → gọi AI và lưu DB
- Các lần sau → trả về ngay từ DB (nhanh hơn, tiết kiệm cost)

### 2. Tự động lấy text
- Mobile không cần gửi text
- Backend tự động lấy từ DB dựa trên articleId

### 3. Error handling
- Timeout protection (20s)
- Retry logic cho cold start
- Graceful error messages

### 4. Performance
- Cache-Control: no-store (không cache HTTP, chỉ cache DB)
- AbortController để cancel request timeout

## File Structure
```
src/app/api/
├── articles/route.ts      # GET /api/articles (đã có)
├── fetch-news/route.ts    # (đã có)
├── summarize/route.ts     # POST /api/summarize (đã có, yêu cầu text)
└── rewrite/route.ts       # ✅ NEW - POST /api/rewrite (chỉ cần articleId)
```

## Dependencies
- ✅ `@prisma/client` - Database ORM
- ✅ `next` - Next.js framework
- ✅ Environment variable: `HF_API_KEY` (HuggingFace API key)

## Testing

### 1. Test bằng curl
```bash
curl -X POST https://baonews-dev.vercel.app/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{"articleId":"<ARTICLE_ID>"}'
```

### 2. Test từ mobile app
1. Mở app → màn NewsList
2. Bấm vào một bài viết → ArticleDetail
3. Bấm nút "Tóm tắt AI"
4. Kiểm tra:
   - Loading indicator hiện
   - POST request đến `/api/rewrite`
   - Response trả về summary
   - UI hiển thị tóm tắt

### 3. Test cache
- Tóm tắt một bài viết lần 1 → mất ~15-20s (gọi AI)
- Tóm tắt lại bài đó lần 2 → nhanh (~1s, từ cache DB)

## Environment Variables
Cần có trong `.env` hoặc Vercel Environment:
```
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Deploy
```bash
cd D:\baovn\apps\web

# Test local
npm run dev
# → http://localhost:3000/api/rewrite

# Deploy Vercel
git add .
git commit -m "Add /api/rewrite endpoint"
git push
# → Vercel auto deploy
```

## Khác biệt với /api/summarize

| Feature | /api/summarize | /api/rewrite (NEW) |
|---------|---------------|-------------------|
| Input | `articleId` + `text` | Chỉ `articleId` |
| Text source | Client gửi | Backend tự lấy từ DB |
| Use case | Web app (đã có text) | Mobile app (chỉ có ID) |
| Cache | Có (DB) | Có (DB) |

## Notes
- Route này tương thích hoàn toàn với mobile app client đã fix
- Sử dụng chung HuggingFace model với `/api/summarize`
- Có thể mở rộng để cache thêm lâu hơn nếu cần (thêm TTL)

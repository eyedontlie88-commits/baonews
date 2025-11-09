export async function summarizeArticle(articleId: string, text: string) {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId, text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Summarize failed');
  return json as { summary: string; saved?: any };
}

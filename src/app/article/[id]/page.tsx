import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArticleDetailClient } from "./ArticleDetailClient";

async function getData(id: string) {
  const article = await db.article.findUnique({
    where: { id },
  });
  if (!article) return null;
  
  // Rewrite có @unique(articleId) nên dùng findUnique theo articleId
  const rewrite = await db.rewrite.findUnique({
    where: { articleId: id },
  });
  
  return { article, rewrite };
}

export const dynamic = "force-dynamic";

export default async function ArticleDetail({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  if (!data) return notFound();
  
  const { article, rewrite } = data;

  return (
    <ArticleDetailClient 
      article={article} 
      initialSummary={rewrite?.content ?? null} 
    />
  );
}

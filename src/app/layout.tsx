import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Web App',
  description: 'Next.js App with fresh preview',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildRev = process.env.NEXT_PUBLIC_APP_BUILD_REV || 'dev';

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="cache-control" content="no-store" />
      </head>
      <body>
        {/* BUILD_REV: {buildRev} */}
        {children}
      </body>
    </html>
  );
}

// Ngăn Next pre-render/thu thập dữ liệu ở build-time
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

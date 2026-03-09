import type { Metadata } from 'next';
import '@/styles/fonts.css';
import '@/styles/theme.css';
import '@/styles/tailwind.css';

export const metadata: Metadata = {
  title: 'Commercial Insights Platform',
  description: 'Strategic launch intelligence for commercial teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

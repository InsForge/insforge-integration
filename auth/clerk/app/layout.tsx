import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider, type Theme } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js InsForge Starter',
  icons: { icon: '/favicon.ico' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const stored = (await cookies()).get('theme')?.value;
  const theme: Theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const dataTheme = theme === 'system' ? undefined : theme;

  return (
    <ClerkProvider>
      <html lang="en" data-theme={dataTheme} suppressHydrationWarning>
        <body>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

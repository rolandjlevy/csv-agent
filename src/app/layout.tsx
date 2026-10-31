import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeToggle } from '@/components/theme-toggle';
import { AboutProvider } from '@/components/about-context';
import { AboutButton } from '@/components/about-button';
import { HomeButton } from '@/components/home-button';
import { Footer } from '@/components/footer';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Statement Sorter',
  description:
    'Turn any UK bank CSV into a categorised P&L, ready for Xero, QuickBooks or FreeAgent. A working demo of an AI agent.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <AboutProvider>
            <div className="fixed top-4 left-4 z-50">
              <HomeButton />
            </div>
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
              <AboutButton />
              <ThemeToggle />
            </div>
            {children}
            <Footer />
          </AboutProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

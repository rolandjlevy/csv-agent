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
import { SITE } from '@/lib/site';
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

const DESCRIPTION =
  'Turn any UK bank CSV into a categorised P&L, ready for Xero, QuickBooks or FreeAgent. A working demo of an AI agent.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.name,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE.name,
    title: `${SITE.name}: turn any bank CSV into a categorised P&L`,
    description: DESCRIPTION,
    locale: 'en_GB',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Statement Sorter home page with a button to try a messy bank export',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name}: turn any bank CSV into a categorised P&L`,
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
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
          defaultTheme="system"
          enableSystem
        >
          <AboutProvider>
            <div className="absolute top-4 left-4 z-50">
              <HomeButton />
            </div>
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
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

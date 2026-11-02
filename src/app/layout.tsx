import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, Bricolage_Grotesque } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AboutProvider } from '@/components/about-context';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { MotionProvider } from '@/components/motion-provider';
import { SITE } from '@/lib/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
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
        className={`${inter.variable} ${plexMono.variable} ${bricolage.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <MotionProvider>
            <AboutProvider>
              <SiteHeader />
              {children}
              <Footer />
            </AboutProvider>
          </MotionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

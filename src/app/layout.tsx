import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { EVENT_INFO } from '@/lib/constants';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${EVENT_INFO.name} | ${EVENT_INFO.tagline} | GNDEC Bidar`,
  description: `Official portal for ${EVENT_INFO.name} (3–5 October 2026), organized by the ${EVENT_INFO.department} at ${EVENT_INFO.institution}. Join the premier national collegiate hackathon and cybersecurity symposium.`,
  keywords: [
    'Hacktober 2026',
    'GNDEC Bidar',
    'Cybersecurity Quiz',
    'Mini Hackathon',
    'Cyber Hunt',
    'Technical Debugging',
    'Cybersecurity Debate',
    'College Hackathon',
  ],
  authors: [{ name: EVENT_INFO.department }],
  creator: EVENT_INFO.institution,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hacktober.gndec.ac.in',
    title: `${EVENT_INFO.name} — ${EVENT_INFO.tagline}`,
    description: `3–5 October 2026 • ${EVENT_INFO.institution}. 5 Signature Events: Hackathon, Cyber Hunt, Quiz, Debate & Debugging.`,
    siteName: EVENT_INFO.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${EVENT_INFO.name} — ${EVENT_INFO.tagline}`,
    description: `3–5 October 2026 • ${EVENT_INFO.institution}. Register now for national technical excellence.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

import CyberBackground from '@/components/common/CyberBackground';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-teal-100 selection:text-teal-900 relative">
        <CyberBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

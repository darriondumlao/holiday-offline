import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Retro ad font for product pages
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
  ),
  title: "holiday is offline",
  description: "holiday is offline",
  icons: {
    icon: '/delmar.ico',
  },
  openGraph: {
    title: "holiday is offline",
    description: "holiday is offline",
    images: [
      {
        url: '/h.png',
        width: 1200,
        height: 1200,
        alt: 'holiday',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "holiday is offline",
    description: "holiday is offline",
    images: ['/h.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Prevent Safari mobile zoom on input focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Preconnect to external APIs for faster requests */}
        <link rel="preconnect" href="https://a.klaviyo.com" />
        <link rel="preconnect" href="https://sheets.googleapis.com" />
        <link rel="dns-prefetch" href="https://a.klaviyo.com" />
        <link rel="dns-prefetch" href="https://sheets.googleapis.com" />
      </head>
      <body className={`antialiased ${bebasNeue.variable}`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import TickerHeader from "@/components/TickerHeader";

export const metadata: Metadata = {
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
        {/* Preconnect to external APIs for faster requests */}
        <link rel="preconnect" href="https://a.klaviyo.com" />
        <link rel="preconnect" href="https://sheets.googleapis.com" />
        <link rel="dns-prefetch" href="https://a.klaviyo.com" />
        <link rel="dns-prefetch" href="https://sheets.googleapis.com" />
      </head>
      <body className="antialiased">
        <TickerHeader />
        {children}
      </body>
    </html>
  );
}

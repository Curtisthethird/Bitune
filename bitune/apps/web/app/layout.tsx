import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Player from "@/components/Player";
import MobileNav from "@/components/MobileNav";
import { PlayerProvider } from "@/context/PlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "BitTune - Stream Music, Earn Bitcoin",
    template: "%s | BitTune"
  },
  description: "The decentralized music marketplace. Stream your favorite tracks and earn Bitcoin. Direct-to-fan sales and social engagement powered by Nostr.",
  keywords: ["Bitcoin", "Lightning Network", "Music", "Streaming", "Decentralized", "Nostr", "BitTune"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bittune.com",
    siteName: "BitTune",
    title: "BitTune - Decentralized Music Streaming",
    description: "Stream Music. Earn Bitcoin.",
    images: [
      {
        url: "/og-image.png", // We should eventually generate this or use a default
        width: 1200,
        height: 630,
        alt: "BitTune - Earn while you listen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BitTune - Stream Music, Earn Bitcoin",
    description: "Direct-to-fan music marketplace on the Lightning Network.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mock track for visual dev, eventually this comes from context or store
  const currentTrack = null;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <PlayerProvider>
            <div className="app-container">
              <Sidebar />

              <div className="main-wrapper">
                <TopBar />

                <main className="content-area">
                  {children}
                </main>
              </div>

              <MobileNav />
              <Player />
            </div>
          </PlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

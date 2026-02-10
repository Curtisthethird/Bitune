import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Player from "@/components/Player";
import MobileNav from "@/components/MobileNav";
import OnboardingGuide from "@/components/OnboardingGuide";
import { PlayerProvider } from "@/context/PlayerContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "BitTune | The Future of Sound",
    template: "%s | BitTune"
  },
  description: "Experience the next generation of music. Stream, support artists with Bitcoin, and own your collection on the Lightning Network.",
  keywords: ["Bitcoin", "Lightning Network", "Music", "Streaming", "Decentralized", "Nostr", "BitTune"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bittune.com",
    siteName: "BitTune",
    title: "BitTune | Decentralized Music Marketplace",
    description: "Stream Music. Support Artists. Earn Bitcoin.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BitTune - The Future of Sound",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BitTune | Stream Music, Earn Bitcoin",
    description: "Direct-to-fan music marketplace on the Lightning Network.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
              <OnboardingGuide />
            </div>
          </PlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

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
  title: "BitTune - Decentralized Music Streaming",
  description: "Stream Music. Earn Bitcoin.",
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

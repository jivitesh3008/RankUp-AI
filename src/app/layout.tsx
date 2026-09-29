import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "RankUp AI",
  description: "A thoughtfully designed education platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen flex bg-background text-foreground`}>
        <Navigation />
        <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden pb-20 md:pb-0 relative">
          <main className="flex-1 flex flex-col w-full relative z-0">
            {children}
          </main>
          <footer className="py-6 border-t border-card-border bg-card-bg mt-auto shrink-0 hidden md:block">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-foreground/50">
              <Link href="/privacy" className="hover:text-primary-500 transition-colors">Privacy</Link>
              <span>&bull;</span>
              <Link href="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
              <span>&bull;</span>
              <Link href="/contact" className="hover:text-primary-500 transition-colors">Contact</Link>
            </div>
            <div className="mt-2 text-center text-xs text-foreground/40">
              RankUp AI. For educational purposes.
            </div>
          </footer>
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
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
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col selection:bg-teal-200 selection:text-teal-900 dark:selection:bg-teal-900 dark:selection:text-teal-100`}>
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-6 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-950/50 mt-auto shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-stone-500 dark:text-stone-400">
            <Link href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms</Link>
            <span>&bull;</span>
            <Link href="/contact" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact</Link>
          </div>
          <div className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
            &copy; {new Date().getFullYear()} RankUp AI. For educational purposes.
          </div>
        </footer>
      </body>
    </html>
  );
}

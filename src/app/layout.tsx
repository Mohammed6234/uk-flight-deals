import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UK Flight Deals",
  description: "Sub-£300 long-haul and standout short-haul from UK airports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="min-h-dvh flex flex-col">
          <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-black/60 border-b border-black/5 dark:border-white/10">
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="inline-block size-5 rounded bg-gradient-to-tr from-indigo-500 to-purple-500" />
                <span>UK Flight Deals</span>
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <Link href="/" className="px-3 py-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition">
                  Home
                </Link>
                <Link
                  href="/subscribe"
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition"
                >
                  Subscribe
                </Link>
              </div>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-black/5 dark:border-white/10 py-8 text-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} UK Flight Deals</p>
              <p>Built with Next.js · Prices are indicative · Always check final fare</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Philog",
  description: "필름 감성 포토 다이어리",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen pb-16 bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}

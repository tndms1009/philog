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
  title: "Philog — 필름 감성 포토 다이어리",
  description:
    "후지필름 카메라로 찍은 사진을 기록하는 개인 포토 다이어리. EXIF와 필름 레시피를 자동으로 인식해요.",
  openGraph: {
    title: "Philog — 필름 감성 포토 다이어리",
    description: "후지필름 카메라로 찍은 사진을 기록하는 개인 포토 다이어리.",
    url: "https://philog-nub9lnk7o-sueun.vercel.app",
    siteName: "Philog",
  },
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

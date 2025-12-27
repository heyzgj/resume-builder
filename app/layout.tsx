import type { Metadata } from "next";
import { Inter, Merriweather, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

// UI Font
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Resume Serif Font (Modern Capital Style)
const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather"
});

// Resume Chinese Font (for Bilingual support)
const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-serif-sc"
});

export const metadata: Metadata = {
  title: "Resume Builder | Quiet Luxury",
  description: "High-end resume builder for investment banking and aesthetic professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(
        inter.variable,
        merriweather.variable,
        notoSerifSC.variable,
        "bg-[#faf9f7] text-neutral-900 font-sans h-screen overflow-hidden antialiased selection:bg-teal-100"
      )}>
        {children}
      </body>
    </html>
  );
}

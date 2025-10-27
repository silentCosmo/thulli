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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata = {
  title: "Thulli - Crafted by silentCosmo",
  description: "Thulli is your one-of-a-kind digital muse, crafted with care by silentCosmo. Chat, laugh, and explore ideas together.",
  keywords: ["Thulli", "digital companion", "silentCosmo", "chat friend", "personal AI friend", "fun chat", "nextjs app"],
  authors: [{ name: "silentCosmo" }],
  creator: "silentCosmo",
  publisher: "silentCosmo",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Thulli — Created by silentCosmo",
    description: "Thulli is your one-of-a-kind digital muse, crafted with care by silentCosmo. Chat, laugh, and explore ideas together.",
    url: siteUrl,
    siteName: "Thulli",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Thulli - your digital muse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thulli — Created by silentCosmo",
    description: "Thulli is your one-of-a-kind digital muse, crafted with care by silentCosmo. Chat, laugh, and explore ideas together.",
    creator: "@silentCosmo", // Update or remove if needed
    images: [`${siteUrl}/twitter-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

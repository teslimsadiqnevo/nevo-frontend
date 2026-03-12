import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nevo | Learning, your way",
  description: "Nevo is a calm, adaptive learning platform built around how each mind learns, focuses, and progresses — not around rigid systems.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" }
    ],
  },
  manifest: "/site.webmanifest",
  applicationName: "Nevo",
  authors: [{ name: "Nevo Learning", url: "https://nevolearning.com" }],
  generator: "Nevo",
  keywords: [
    "Nevo",
    "Learning Platform",
    "Adaptive Learning",
    "EdTech",
    "Education Technology",
    "Personalized Education",
    "Students",
    "Teachers",
    "Schools"
  ],
  referrer: "origin",
  creator: "Nevo Learning",
  publisher: "Nevo Learning",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    nosnippet: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-snippet': -1,
      'max-image-preview': "large",
      notranslate: false,
    }
  },
  openGraph: {
    type: "website",
    url: "https://nevolearning.com",
    title: "Nevo | Learning, your way",
    description: "Nevo is a calm, adaptive learning platform built around how each mind learns.",
    siteName: "Nevo",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Nevo | Learning, your way",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nevolearning",
    creator: "@nevolearning",
    title: "Nevo | Learning, your way",
    description: "Nevo is a calm, adaptive learning platform built around how each mind learns.",
    images: "/og-image.jpeg",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-parchment text-graphite antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JurnalGPT – AI pencari jurnal",
  description: "Platform AI yang menjawab berdasarkan jurnal ilmiah untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.",
  keywords: ["JurnalGPT", "Jurnal AI", "AI Cari Jurnal", "AI Pencari Jurnal", "AI Pencari Jurnal Gratis", "Penelitian Ilmiah", "Laprak", "Skripsi"],
  metadataBase: new URL('https://jurnalgpt.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "JurnalGPT – AI untuk Jurnal Ilmiah",
    description: "Platform AI yang menjawab berdasarkan jurnal untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.",
    url: 'https://jurnalgpt.app',
    siteName: 'JurnalGPT',
    images: [
      {
        url: '/1200.png', // Assuming we have or will have this
        width: 1200,
        height: 630,
        alt: 'JurnalGPT Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "JurnalGPT – AI untuk Jurnal Ilmiah",
    description: "Platform AI yang menjawab berdasarkan jurnal ilmiag untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.",
    images: ['/og-image.png'],
  },
  icons: {
    icon: "/32.png",
    apple: "/32.png",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JurnalGPT',
  description: 'Platform AI yang menjawab berdasarkan jurnal ilmiah untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.',
  url: 'https://jurnalgpt.app',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
};




import LayoutWrapper from "@/components/LayoutWrapper";






export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, geistSans.variable, geistMono.variable)}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

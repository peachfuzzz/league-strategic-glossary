import type { Metadata } from "next";
import { Newsreader, Source_Serif_4, Inter, JetBrains_Mono, Crimson_Pro, Spectral, Literata } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-spectral",
  weight: ["400", "600"],
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

const literata   = Literata({ 
  subsets: ["latin"], 
  variable: "--font-literata", 
  display: "swap" 
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "League Strategic Glossary",
  description: "A graph visualization of strategic League of Legends terms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${spectral.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

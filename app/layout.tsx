import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Royal Boss — Certificado Original",
  description:
    "Certificado digital de autenticidad Royal Boss. Original. Tuya.",
  openGraph: {
    title: "Royal Boss — Certificado Original",
    description: "Esta es tu Royal Boss. Original. Verificada.",
    url: "https://royal-boss.com/RoyalCrown",
    siteName: "Royal Boss",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bebas.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-h-svh flex-col bg-rb-black text-rb-white">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./_components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://activity-187.vercel.app"),
  title: {
    default: "Portal de Eventos · CI Ingeniería Informática",
    template: "%s · CI Ingeniería Informática",
  },
  description:
    "Explora e inscríbete en los torneos, competencias y ferias de emprendimiento de la Semana Facultativa 2026 — Ingeniería Informática, UAGRM.",
  applicationName: "Portal de Eventos CI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eventos CI",
  },
  openGraph: {
    type: "website",
    locale: "es_BO",
    url: "/",
    siteName: "Portal de Eventos · CI Ingeniería Informática",
    title: "Portal de Eventos · CI Ingeniería Informática",
    description:
      "Torneos, competencias y ferias de emprendimiento de la Semana Facultativa 2026 — Ingeniería Informática, UAGRM. Inscríbete en línea.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Escudo Ingeniería Informática UAGRM — Portal de Eventos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal de Eventos · CI Ingeniería Informática",
    description:
      "Torneos, competencias y ferias de la Semana Facultativa 2026 — Ingeniería Informática, UAGRM.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div className="fixed-background-bg" />
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}


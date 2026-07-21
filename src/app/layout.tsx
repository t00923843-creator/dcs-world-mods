import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL ?? "https://dcs-world-mods.vercel.app"
  ),
  title: {
    default: `${SITE_NAME} — Community Hub`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  verification: {
    google: "aW7SmvSu6o_lSPdmwpfaqEAkl1RI4GkbUdpnpmifs_0",
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
const WRITESONIC_SITE_ID = process.env.NEXT_PUBLIC_WRITESONIC_SITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        {WRITESONIC_SITE_ID && (
          <>
            <Script
              src="https://seo-fixer.writesonic.com/site-audit/fixer-script/index.js"
              strategy="afterInteractive"
            />
            <Script id="writesonic-seo-fixer" strategy="afterInteractive">
              {`
                wsSEOfixer.configure({
                  hostURL: 'https://seo-fixer.writesonic.com',
                  siteID: '${WRITESONIC_SITE_ID}'
                });
              `}
            </Script>
          </>
        )}
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://mjmetal.co.uk"),

  title: "M&J Metal | Bespoke Gates & Metal Fabrication",

  description:
    "Bespoke metal gates, railings, side passage gates, security grilles and steel fabrication across London and the South East.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "M&J Metal",
    description:
      "Bespoke metal gates, railings and security metalwork across London.",
    url: "https://mjmetal.co.uk",
    siteName: "M&J Metal Ltd",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "M&J Metal",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "M&J Metal",
    description:
      "Bespoke metal gates, railings and security metalwork across London.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

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
      <body className="min-h-full flex flex-col">
  {children}

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "M&J Metal Ltd",
        url: "https://mjmetal.co.uk",
        telephone: "+447784468113",
email: "info@mjmetal.co.uk",
identifier: "17330239",
address: {
          "@type": "PostalAddress",
          streetAddress:
            "Office 6, 1st Floor, Sutherland House, 70–78 West Hendon Broadway",
          addressLocality: "London",
          postalCode: "NW9 7BT",
          addressCountry: "GB",
        },
      }),
    }}
  />
</body>
    </html>
  );
}

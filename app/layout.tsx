import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "How They Test",
  description: "A curated collection of publicly available resources on how software companies around the world test their software systems and build their quality culture.",
  keywords: ["testing", "quality assurance", "QA", "software testing", "test automation", "quality engineering"],
  authors: [{ name: "Abhijeet Vaikar" }],
  openGraph: {
    title: "How They Test",
    description: "A curated collection of publicly available resources on how software companies test their software",
    url: "https://abhivaikar.github.io/howtheytest/",
    siteName: "How They Test",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How They Test",
    description: "A curated collection of publicly available resources on how software companies test their software",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.netlify.app https://challenges.cloudflare.com https://*.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data: https:;"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

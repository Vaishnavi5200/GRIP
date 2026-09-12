import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GRIP — Gig Regulatory Intelligence Platform",
    template: "%s | GRIP",
  },
  description:
    "GRIP is your AI-powered regulatory intelligence platform for gig-economy companies, turning complex regulatory documents into clear business decisions.",
  keywords: [
    "GRIP",
    "gig regulatory intelligence",
    "gig worker compliance",
    "Karnataka welfare fee",
    "Karnataka Gig Workers Act 2025 compliance",
    "gig economy compliance India",
    "platform gig worker welfare fund",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GigShield — Gig Worker Compliance Operations",
    template: "%s | GigShield",
  },
  description:
    "GigShield is a compliance operations layer for India's gig economy, combining versioned regulatory rules, deterministic fee calculations, transaction-level reconciliation, and AI-assisted regulatory change analysis.",
  keywords: [
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

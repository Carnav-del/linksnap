import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkSnap — short links, live clicks",
  description: "A URL shortener with a real-time click analytics dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

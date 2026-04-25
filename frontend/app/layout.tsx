import type { Metadata } from "next";
import "./globals.css";
// Move Leaflet CSS here
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: "BKK Accessibility",
  description: "Real-time transit accessibility tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
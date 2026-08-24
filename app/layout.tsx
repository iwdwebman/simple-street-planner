import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2D Street Traffic Simulator",
  description: "Multi-modal cross-section traffic simulator built with Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}


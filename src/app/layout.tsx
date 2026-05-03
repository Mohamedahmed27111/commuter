import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Commuter — Egypt's smarter way to share the ride",
  description: "Egypt's leading ride-pooling platform for daily commuters and drivers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased bg-surface text-primary ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}

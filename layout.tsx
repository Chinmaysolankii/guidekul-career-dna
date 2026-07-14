import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guidekul Career DNA",
  description:
    "Guidekul Career DNA - explore careers for Indian students, powered by Guidekul.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

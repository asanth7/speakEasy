import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Public Speaking Assistant UI",
  description: "Public Speaking Assistant Application",
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


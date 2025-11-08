import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "../styles/globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

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
    <html lang="en" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}


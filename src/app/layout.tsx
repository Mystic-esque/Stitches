import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitches — a personal sewing studio",
  description: "Patterns that adapt to you, with every change explained.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

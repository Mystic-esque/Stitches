import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitches — see how it’s made. Make it yours.",
  description: "A project-aware sewing companion connecting the garment you imagine to the pieces, decisions, and steps needed to make it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

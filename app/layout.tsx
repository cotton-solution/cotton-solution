import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bahar-e-Madina Commission Agent",
  description:
    "Enterprise accounting, brokerage & agricultural commission management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

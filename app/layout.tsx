import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

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
      <body>
        <div className="min-h-screen bg-slate-50">
          <Sidebar />
          <div className="lg:pl-64 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

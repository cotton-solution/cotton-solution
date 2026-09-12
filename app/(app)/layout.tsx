import type { Metadata } from "next";
import "../globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Bahar-e-Madina Commission Agent",
  description:
    "Enterprise accounting, brokerage & agricultural commission management system",
};

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>
            <div className="min-h-screen bg-slate-50">
              <Sidebar />
              <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 sm:p-6">{children}</main>
              </div>
            </div>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}

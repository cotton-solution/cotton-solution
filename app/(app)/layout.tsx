import type { Metadata } from "next";
import "../globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGate } from "@/components/auth-gate";
import { BusinessProvider } from "@/components/business-provider";
import { BusinessGate } from "@/components/business-gate";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { fetchSiteSettings } from "@/lib/supabase/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await fetchSiteSettings();
  return {
    title: `${siteName} Commission Agent`,
    description:
      "Enterprise accounting, brokerage & agricultural commission management system",
  };
}

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteSettingsProvider>
          <AuthProvider>
            <AuthGate>
              <BusinessProvider>
                <BusinessGate>
                  <div className="min-h-screen bg-slate-50">
                    <Sidebar />
                    <div className="lg:pl-64 flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1 p-4 sm:p-6">{children}</main>
                    </div>
                  </div>
                </BusinessGate>
              </BusinessProvider>
            </AuthGate>
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

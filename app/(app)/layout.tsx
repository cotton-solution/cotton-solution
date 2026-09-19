import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGate } from "@/components/auth-gate";
import { BusinessProvider } from "@/components/business-provider";
import { BusinessGate } from "@/components/business-gate";
import { ModuleGate } from "@/components/module-gate";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { fetchSiteSettings } from "@/lib/supabase/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await fetchSiteSettings();
  return {
    title: siteName,
    description: "Accounting, invoicing & business management",
  };
}

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
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
                      <main className="flex-1 p-4 sm:p-6">
                        <ModuleGate>{children}</ModuleGate>
                      </main>
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

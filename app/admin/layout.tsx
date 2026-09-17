import type { Metadata } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/components/auth-provider";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { fetchSiteSettings } from "@/lib/supabase/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await fetchSiteSettings();
  return {
    title: `${siteName} — Service Admin`,
    description: "Manage registered businesses and subscriptions",
  };
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SiteSettingsProvider>
          <AuthProvider>{children}</AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

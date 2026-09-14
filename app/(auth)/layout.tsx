import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { fetchSiteSettings } from "@/lib/supabase/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await fetchSiteSettings();
  return {
    title: `${siteName} — Account Management Portal`,
    description: `Log in to the ${siteName} portal`,
  };
}

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteSettingsProvider>
          <AuthProvider>{children}</AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { fetchSiteSettings } from "@/lib/supabase/site-settings";

// Scoped to the (auth) route group only — login, signup, forgot-password.
// Does not touch the main app/admin layouts or their fonts.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const figureFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figure",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} ${figureFont.variable}`}>
      <body>
        <SiteSettingsProvider>
          <AuthProvider>{children}</AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

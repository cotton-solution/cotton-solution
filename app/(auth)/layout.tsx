import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Bahar-e-Madina — Account Management Portal",
  description: "Log in to the Bahar-e-Madina Commission Agent portal",
};

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Bahar-e-Madina — Service Admin",
  description: "Manage registered businesses and subscriptions",
};

export default function AdminRootLayout({
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

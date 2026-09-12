import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Bahar-e-Madina — Admin Login",
  description: "Log in to the Bahar-e-Madina Commission Agent admin portal",
};

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}

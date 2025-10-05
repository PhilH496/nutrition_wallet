import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "../styles/globals.css";
export const metadata: Metadata = {
  title: "Nutrition Wallet",
  description: "Track your nutrition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
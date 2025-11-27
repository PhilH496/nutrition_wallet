import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import "@mantine/core/styles.css";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Nutrition Wallet",
  description: "Nutrition tracker with OCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}> 
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=GFS+Neohellenic:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>
          <MantineProvider defaultColorScheme="light">
            <AuthProvider>{children}</AuthProvider>
          </MantineProvider>
      </body>
    </html>
  );
}

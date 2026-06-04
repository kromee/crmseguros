import type { Metadata } from "next";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/core/constants";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_TAGLINE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

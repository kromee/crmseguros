import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Seguros Mexa CRM",
  description: "CRM Corporativo para agente de seguros — Innovando tu seguridad, protegiendo tu mañana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

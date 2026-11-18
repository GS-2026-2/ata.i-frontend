import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/app-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATA.I · Gestão de prioridades escolares",
  description:
    "Organize as prioridades anuais da escola, registre reuniões e atas e preserve a rastreabilidade de cada decisão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-[var(--atai-bg)] text-[var(--atai-navy)] antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

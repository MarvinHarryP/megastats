import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { IntroAnimation } from "@/components/layout/IntroAnimation";
import { WalletAutoRedirect } from "@/components/wallet/WalletAutoRedirect";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MegaStats — MegaETH Wallet Analytics",
  description: "Track your MegaETH on-chain activity: fees, volume, transactions, and streaks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <IntroAnimation />
          <WalletAutoRedirect />
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}

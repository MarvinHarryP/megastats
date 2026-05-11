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
          <footer className="border-t mt-12 py-6">
            <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Built by MarvinHarryP</span>
                <a
                  href="https://x.com/MarvinHarryP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  title="X / Twitter"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                  </svg>
                </a>
              </div>
              <a
                href="https://cryptoxmap.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-muted hover:text-foreground transition-colors text-xs font-medium"
              >
                🗺️ Explore other projects by MarvinHarryP → cryptoxmap.xyz
              </a>
            </div>
          </footer>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}

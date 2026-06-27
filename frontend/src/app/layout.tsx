import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowVault — Stellar Soroban Linear Vesting Protocol",
  description: "Secure, real-time continuous token vesting and linear streaming on the Stellar network using Soroban smart contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-zinc-900 bg-zinc-50">
        {children}
      </body>
    </html>
  );
}

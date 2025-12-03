import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Storax – Zero-Knowledge Storage on Solana",
  description:
    "Secure, encrypted file storage with zero-knowledge proofs on Solana. Upload, encrypt, and store your files on IPFS with wallet-based encryption.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

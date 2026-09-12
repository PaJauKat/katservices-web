import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Shell from "@/components/Shell";
import { STORE } from "@/lib/config";

export const metadata: Metadata = {
  title: `${STORE.name} | OSRS Services`,
  description:
    "Buy OSRS combat achievement and boss services. Prices in OSRS GP with real currency conversion.",
};

const fontsUrl =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontsUrl} rel="stylesheet" />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

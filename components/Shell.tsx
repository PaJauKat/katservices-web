"use client";

import Image from "next/image";
import Link from "next/link";

import { ShopProvider } from "@/components/ShopProvider";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import DiscordButton from "@/components/DiscordButton";
import { STORE } from "@/lib/config";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ShopProvider>
      <div className="ambient-background" aria-hidden="true">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>
      <div className="page-container" id="top">
        <Header />
        {children}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <Image
                src="/images/kat-services-logo.png"
                alt={`${STORE.name} logo`}
                width={30}
                height={30}
                className="brand-img"
                style={{ objectFit: "contain" }}
              />
              <span className="footer-title">{STORE.name}</span>
            </div>
            <p className="footer-quote">
              &quot;Boosting excellence, one achievement at a time.&quot;
            </p>
            <div className="footer-links">
              <Link href="/combat-achievements">Combat Achievements</Link>
              <Link href="/ca-tier-calculator">Calculadora CA</Link>
              <Link href="/#gear">Featured Gear</Link>
              <DiscordButton
                className="footer-discord"
                label={`Discord @${STORE.discord.username}`}
              />
            </div>
            <div className="footer-copy">
              © {new Date().getFullYear()} {STORE.name}. Not affiliated with Jagex Ltd.
            </div>
          </div>
        </footer>
      </div>
      <CartDrawer />
      <Toast />
    </ShopProvider>
  );
}

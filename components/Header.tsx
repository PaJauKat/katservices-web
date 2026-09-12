"use client";

import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/components/ShopProvider";
import DiscordButton from "@/components/DiscordButton";
import { STORE } from "@/lib/config";

export default function Header() {
  const { cartCount, openCart } = useShop();

  return (
    <header className="navbar">
      <Link href="/" className="brand">
        <Image
          src="/images/kat-services-logo.png"
          alt={`${STORE.name} logo`}
          width={38}
          height={38}
          className="brand-img"
          style={{ objectFit: "contain" }}
        />
        <div className="brand-text">
          <span className="brand-name">
            {STORE.name}
            <span className="dot">.</span>
          </span>
          <span className="brand-sub">{STORE.tagline}</span>
        </div>
      </Link>

      <div className="nav-actions">
        <DiscordButton className="btn btn-discord discord-desktop" />
        <button className="cart-btn" onClick={openCart} aria-label="Open cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="label">Cart</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

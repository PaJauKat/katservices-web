import Link from "next/link";
import Image from "next/image";
import { groups, services, formatIntPrice, initCatalog } from "@/lib/services";
import { gearItems, initGear, iconIsImage } from "@/lib/gear";
import DiscordButton from "@/components/DiscordButton";
import { STORE } from "@/lib/config";

export const dynamic = "force-static";

const caHilts = [
  { src: "/images/ca-hilts/Ghommal_hilt_1.png", tier: "Easy" },
  { src: "/images/ca-hilts/Ghommal_hilt_2.png", tier: "Medium" },
  { src: "/images/ca-hilts/Ghommal_hilt_3.png", tier: "Hard" },
  { src: "/images/ca-hilts/Ghommal_hilt_4.png", tier: "Elite" },
  { src: "/images/ca-hilts/Ghommal_hilt_5.png", tier: "Master" },
  { src: "/images/ca-hilts/Ghommal_hilt_6.png", tier: "Grandmaster" },
];

const steps = [
  {
    step: "01",
    title: "Select & Cart",
    text: "Pick your CAs or bosses and choose your currency (GP, USD, CLP, EUR).",
  },
  {
    step: "02",
    title: "Send Discord Tag",
    text: "Submit the order so I can message you directly on Discord.",
  },
  {
    step: "03",
    title: "Pay & Get Boosted",
    text: "Confirm payment, hand over access, and I'll complete the job.",
  }
];

export default async function HomePage() {
  await initCatalog();
  await initGear();
  const totalServices = services.length;
  const categories = groups.length;
  const fromPrice = groups
    .flatMap((g) => g.items)
    .reduce((min, it) => Math.min(min, it.intPrice), Infinity);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>Services Available now</span>
          </div>

          <h1 className="hero-title">
            Skip the <br />
            <span className="highlight">Grind.</span>
          </h1>

          <p className="hero-description">
            Buy BiS items or Combat Achievements tasks from{" "}
            <strong className="text-white">{STORE.name}</strong>. Multiple payment methods available. Login Service, I must login into your account, so you have to Trust in me.
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">Trusted</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">Discreet</span>
              <span className="stat-label"> & </span>
              <span className="stat-number">Safe</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number gold">Tax Free</span>
            </div>
          </div>

          <div className="hero-cta">
            <a href="#services" className="btn btn-primary">
              <span>Browse services</span>
              <span>→</span>
            </a>
            <DiscordButton className="btn btn-secondary" label="Contact me on Discord" />
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-frame">
            <div className="hero-frame-glow"></div>
            <div className="hero-frame-border">
              <Image
                src="/images/home-img.png"
                alt={`${STORE.name} - OSRS services artwork`}
                fill
                sizes="(max-width: 900px) 100vw, 440px"
                className="hero-frame-img"
              />
              <div className="hero-frame-shade"></div>
              
            </div>
          </div>
        </div>
      </section>

      <section id="gear" className="section featured-gear-section">
        <div className="section-header">
          <div className="header-badge">FEATURED ITEMS</div>
          <h2 className="section-title">
            High-value <span className="highlight-red">items</span>, on demand
          </h2>
          <p className="section-sub">
            Each item has its own page with requirements and price modifiers.
          </p>
        </div>

        <div className="gear-featured-grid">
          {gearItems.map((g) => (
            <Link key={g.slug} href={`/gear/${g.slug}`} className="gear-feature-card">
              <div className="gear-feature-art">
                <div className="gear-feature-glow"></div>
                {g.image ? (
                  <Image src={g.image} alt={g.name} fill sizes="(max-width: 900px) 50vw, 320px" className="gear-feature-img" />
                ) : iconIsImage(g.icon) ? (
                  <Image src={g.icon} alt={g.name} width={120} height={120} className="gear-feature-img" />
                ) : (
                  <span className="gear-feature-emoji">{g.icon}</span>
                )}
                <span className="gear-feature-chip">
                  {iconIsImage(g.icon) ? (
                    <Image src={g.icon} alt="" width={16} height={16} className="gear-feature-chip-img" />
                  ) : (
                    <span className="gear-feature-chip-emoji">{g.icon}</span>
                  )}
                  FEATURED
                </span>
              </div>
              <div className="gear-feature-body">
                <div className="gear-feature-name">{g.name}</div>
                <div className="gear-feature-tagline">{g.tagline}</div>
                <div className="gear-feature-foot">
                  <span className="gear-feature-price">
                    from {formatIntPrice(g.basePriceGP)} GP
                  </span>
                  <span className="gear-feature-arrow" aria-hidden="true">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="services" className="section combat-achievements-section">
        <div className="ca-banner-grid">
          <Link href="/combat-achievements" className="ca-banner-card">
            <div className="ca-banner-info">
              <div className="header-badge">CHOOSE INDIVIDUAL TASKS</div>
              <h2 className="section-title">
                Combat Achievements
              </h2>
              <p className="ca-banner-desc">
                Browse {totalServices} tasks across {categories} categories and add exactly the
                ones you want, individually.
              </p>
              <span className="btn btn-primary btn-lg">
                <span>View all Combat Achievements</span>
                <span>→</span>
              </span>
            </div>
            <div className="ca-banner-visual">
              <Image
                src="/images/zuk-helm.png"
                alt="Zuk helmet"
                width={288}
                height={270}
                className="ca-banner-zuk"
              />
            </div>
          </Link>

          <Link href="/ca-tier-calculator" className="ca-banner-card">
            <div className="ca-banner-info">
              <div className="header-badge">CHOOSE TARGET TIER</div>
              <h2 className="section-title">
                CA Tier <span className="highlight-red">Calculator</span>
              </h2>
              <p className="ca-banner-desc">
                Enter your RSN to see your current tier, missing points and the estimated GP
                cost to reach your target.
              </p>
              <span className="btn btn-gold btn-lg">
                <span>Check my progress</span>
                <span>→</span>
              </span>
            </div>
            <div className="ca-banner-visual">
              <div className="ca-hilts">
                {caHilts.map((h, i) => (
                  <div className="ca-hilt" key={h.src}>
                    <div className="ca-hilt-medallion">
                      <Image
                        src={h.src}
                        alt={`Ghommal's hilt ${i + 1} (${h.tier})`}
                        width={46}
                        height={46}
                        className="ca-hilt-img"
                      />
                    </div>
                    <span className="ca-hilt-tier">{h.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div className="header-badge">HOW IT WORKS</div>
          <h2 className="section-title">
            Simple and <span className="highlight-red">Safe</span>
          </h2>
        </div>
        <div className="how-grid">
          {steps.map((s) => (
            <div className="how-card" key={s.step}>
              <div className="how-step">STEP {s.step}</div>
              <div className="how-title">{s.title}</div>
              <div className="how-text">{s.text}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

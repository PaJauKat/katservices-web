import { NextResponse } from "next/server";
import { CHECKOUT, STORE } from "@/lib/config";
import { services, formatIntPrice, initCatalog } from "@/lib/services";
import type { CartEntry } from "@/lib/types";

function genOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `KAT-${out}`;
}

interface OrderBody {
  rsn?: string;
  currency?: string;
  items?: CartEntry[];
}

export async function POST(req: Request) {
  try {
    await initCatalog();
    const body = (await req.json()) as OrderBody;
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    const rsn = (body.rsn ?? "").trim().slice(0, 12);
    const currency = (body.currency ?? "GP").toUpperCase();

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
    }

    const validIds = new Set(services.map((s) => s.id));
    for (const it of items) {
      const isGear = it.id.startsWith("gear-");
      const isValid = isGear || validIds.has(it.id);
      if (!isValid || it.qty < 1 || it.qty > 99 || !Number.isInteger(it.intPrice)) {
        return NextResponse.json({ ok: false, error: "Invalid item in cart." }, { status: 400 });
      }
    }

    const totalGP = items.reduce((acc, it) => acc + it.intPrice * it.qty, 0);
    const orderId = genOrderId();

    const lines = items
      .map((it) => {
        const metaParts = [it.option, it.content, it.note].filter(Boolean).join(" / ");
        const meta = metaParts ? ` (${metaParts})` : "";
        return `- ${it.text}${meta} x${it.qty} — **${formatIntPrice(it.intPrice)} GP**`;
      })
      .join("\n");

    const description = [
      `**RSN:** ${rsn || "Not provided"}`,
      `**Display currency:** ${currency}`,
      "",
      lines,
      "",
      `**Total: ${formatIntPrice(totalGP)} GP**`,
    ].join("\n");

    const embed = {
      color: 0xff2a55,
      title: `New order ${orderId}`,
      description,
      timestamp: new Date().toISOString(),
      footer: { text: `${STORE.name} order system` },
    };

    if (!CHECKOUT.discordWebhook) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Automatic Discord delivery is not configured on this deployment (DISCORD_WEBHOOK_URL). Please copy your cart and message us on Discord to arrange the order.",
          orderId,
        },
        { status: 500 }
      );
    }

    const res = await fetch(CHECKOUT.discordWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Discord webhook failed (HTTP ${res.status}). Please copy your cart and message us manually.` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, orderId });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not process the order. Please try again or message us on Discord." },
      { status: 500 }
    );
  }
}

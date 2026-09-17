import { NextResponse } from "next/server";
import { CHECKOUT, STORE } from "@/lib/config";
import { services, formatIntPrice, initCatalog } from "@/lib/services";
import { computeCartBreakdown } from "@/lib/pricing";
import type { CartEntry } from "@/lib/types";

function genOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `KAT-${out}`;
}

interface OrderBody {
  discord?: string;
  currency?: string;
  items?: CartEntry[];
}

export async function POST(req: Request) {
  try {
    await initCatalog();
    const body = (await req.json()) as OrderBody;
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    const discord = (body.discord ?? "").trim().slice(0, 32);
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

    const breakdown = computeCartBreakdown(items);
    const totalGP = breakdown.totalGP;
    const orderId = genOrderId();

    const lines: string[] = [];
    for (const group of breakdown.groups) {
      if (group.isGear) {
        for (const it of group.tasks) {
          const metaParts = [it.option, it.content, it.note].filter(Boolean).join(" / ");
          const meta = metaParts ? ` (${metaParts})` : "";
          lines.push(
            `- ${it.text}${meta} x${it.qty} — **${formatIntPrice(it.effGP)} GP**`
          );
        }
        continue;
      }
      if (group.chargeBase) {
        lines.push(
          `**Kill Base - ${group.key}:** ${group.baseGP > 0 ? formatIntPrice(group.baseGP) : "0"} GP`
        );
      }
      for (const it of group.tasks) {
        const metaParts = [it.content, it.note].filter(Boolean).join(" / ");
        let meta = metaParts ? ` (${metaParts})` : "";
        if (it.killsNeeded != null && it.kills != null && group.baseGP > 0) {
          const need = it.killsNeeded < it.kills
            ? `${it.killsNeeded}/${it.kills} kills needed`
            : `${it.kills} kills`;
          meta += ` [${need}]`;
        }
        if (it.coveredBy) meta += ` [incl. with ${it.coveredBy}]`;
        lines.push(`+ ${it.text}${meta} x${it.qty} — **${formatIntPrice(it.effGP)} GP**`);
      }
    }

    const description = [
      `**Discord:** ${discord || "Not provided"}`,
      `**Display currency:** ${currency}`,
      "",
      ...lines,
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

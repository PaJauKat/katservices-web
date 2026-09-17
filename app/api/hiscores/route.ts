import { NextResponse } from "next/server";
import { fetchPlayerKills } from "@/lib/hiscores";

/** Caché en memoria simple para no golpear los hiscores de Jagex. */
const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;

function cached(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function store(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = Array.from(cache.entries()).sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { at: Date.now(), data });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rsn = (searchParams.get("user") ?? "").trim();
  if (!rsn || rsn.length > 12 || !/^[a-zA-Z0-9 _&.\-]+$/.test(rsn)) {
    return NextResponse.json(
      { error: "Invalid username. OSRS names are up to 12 characters (letters, numbers, spaces, _ & . -)." },
      { status: 400 }
    );
  }

  const cacheKey = rsn.toLowerCase();
  const hit = cached(cacheKey);
  if (hit) {
    return NextResponse.json(hit, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  }

  try {
    const data = await fetchPlayerKills(rsn);
    store(cacheKey, data);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error.";
    const notFound = /not found/i.test(msg);
    return NextResponse.json(
      { error: msg },
      { status: notFound ? 404 : 502 }
    );
  }
}
import { NextResponse } from "next/server";

const WIKI_ENDPOINT = (rsn: string) =>
  `https://sync.runescape.wiki/runelite/player/${encodeURIComponent(rsn)}/STANDARD`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rsn = searchParams.get("username")?.trim();

  if (!rsn) {
    return NextResponse.json({ error: "Missing username parameter." }, { status: 400 });
  }

  try {
    const response = await fetch(WIKI_ENDPOINT(rsn), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; katservices-web/1.0)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `RuneLite API returned status ${response.status}.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}
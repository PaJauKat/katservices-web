/**
 * Consulta de kills por boss en los OSRS hiscores.
 *
 * Jagex ya no expone el endpoint JSON clasico (hiscore.ws); la pagina
 * "Compare Users" (m=hiscore_oldschool/compare?user1=<RSN>) si lista los
 * kills de cada boss para el jugador. Este modulo obtiene esa pagina y la
 * parsea server-side.
 *
 * El mapeo tabla -> boss viene del sidebar oficial de hiscores
 * (overall?category_type=1&table=N), normalizado a los nombres de
 * final_data.json / bosses-prices.json.
 */

export interface PlayerKills {
  username: string;
  /** boss -> kills (0 cuando el jugador no figura en esa tabla). */
  kills: Record<string, number>;
}

export const HISCORE_COMPARE_URL =
  "https://secure.runescape.com/m=hiscore_oldschool/compare?user1=";

/** table (category_type=1) -> nombre de boss como aparece en final_data.json. */
export const HISCORE_TABLE_MAP: Record<number, string> = {
  20: "Abyssal Sire",
  21: "Alchemical Hydra",
  22: "Amoxliatl",
  23: "Araxxor",
  24: "Artio",
  25: "Barrows",
  26: "Brutus",
  27: "Bryophyta",
  28: "Callisto",
  29: "Calvar'ion",
  30: "Cerberus",
  31: "Chambers of Xeric",
  32: "Chambers of Xeric: Challenge Mode",
  33: "Chaos Elemental",
  34: "Chaos Fanatic",
  35: "Commander Zilyana",
  36: "Corporeal Beast",
  37: "Crazy Archaeologist",
  38: "Dagannoth Prime",
  39: "Dagannoth Rex",
  40: "Dagannoth Supreme",
  41: "Deranged Archaeologist",
  42: "Doom of Mokhaiotl",
  43: "Duke Sucellus",
  44: "General Graardor",
  45: "Giant Mole",
  46: "Grotesque Guardians",
  47: "Hespori",
  48: "Kalphite Queen",
  49: "King Black Dragon",
  50: "Kraken",
  51: "Kree'arra",
  52: "K'ril Tsutsaroth",
  53: "Lunar Chests",
  54: "Mad Angel",
  55: "Maggot King",
  56: "Mimic",
  57: "Nex",
  58: "The Nightmare",
  59: "Phosani's Nightmare",
  60: "Obor",
  61: "Phantom Muspah",
  62: "Sarachnis",
  63: "Scorpia",
  64: "Scurrius",
  65: "Shellbane gryphon",
  66: "Skotizo",
  67: "Sol Heredit",
  68: "Spindel",
  69: "Tempoross",
  70: "Crystalline Hunllef",
  71: "Corrupted Hunllef",
  72: "The Hueycoatl",
  73: "The Leviathan",
  74: "Royal Titans",
  75: "Whisperer",
  76: "Theatre of Blood",
  77: "Theatre of Blood: Hard Mode",
  78: "Thermonuclear Smoke Devil",
  79: "Tombs of Amascut",
  80: "Tombs of Amascut: Expert Mode",
  81: "TzKal-Zuk",
  82: "TzTok-Jad",
  83: "Vardorvis",
  84: "Venenatis",
  85: "Vet'ion",
  86: "Vorkath",
  87: "Wintertodt",
  88: "Yama",
  89: "Zalcano",
  90: "Zulrah",
};

const ROW_RE = /<tr>([\s\S]*?)<\/tr>/g;
const BOSS_LINK_RE = /overall\?category_type=1&table=(\d+)&[^>]*>([^<]+)<\/a>/;
const SCORE_RE = /(\d[\d,]*)\s*<\/td>/g;
const NOT_RANKED_RE = /Not Ranked/;

/**
 * Parseala pagina /compare?user1=<rsn> (HTML) extrayendo los kills de cada
 * boss con tabla hiscore. Filas sin pertenencia al usuario -> 0 kills.
 */
export function parseCompareHtml(html: string): Record<string, number> {
  const out: Record<string, number> = {};
  let match: RegExpExecArray | null;
  ROW_RE.lastIndex = 0;
  while ((match = ROW_RE.exec(html)) !== null) {
    const row = match[1];
    const bossLink = row.match(BOSS_LINK_RE);
    if (!bossLink) continue;
    const tableId = parseInt(bossLink[1], 10);
    const boss = HISCORE_TABLE_MAP[tableId];
    if (!boss) continue;

    // seccion del usuario 1: termina en la flecha comparativa (o el td de
    // "no rankeado" si no hay comparacion contra otro user2).
    const up = row.indexOf("arrowup2.gif");
    const down = row.indexOf("arrowdown2.gif");
    const arrow = up > -1 && down > -1
      ? Math.min(up, down)
      : Math.max(up, down);
    const section = arrow > -1 ? row.slice(0, arrow) : row;

    if (NOT_RANKED_RE.test(section)) {
      out[boss] = 0;
      continue;
    }

    const scores: number[] = [];
    let s: RegExpExecArray | null;
    SCORE_RE.lastIndex = 0;
    while ((s = SCORE_RE.exec(section)) !== null) {
      scores.push(parseInt(s[1].replace(/,/g, ""), 10));
    }
    // ultima cifra de la seccion = score (rank, espacio, score)
    out[boss] = scores.length > 0 ? scores[scores.length - 1] : 0;
  }
  return out;
}

export async function fetchPlayerKills(
  rsn: string,
  fetchFn: typeof fetch = fetch
): Promise<PlayerKills> {
  const res = await fetchFn(
    `${HISCORE_COMPARE_URL}${encodeURIComponent(rsn)}`,
    {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; katservices-web/1.0)",
      },
      cache: "no-store",
    }
  );
  if (res.status === 404 || res.status === 410) {
    throw new Error(`Player '${rsn}' not found on the OSRS hiscores.`);
  }
  if (!res.ok) {
    throw new Error(`OSRS hiscores returned status ${res.status}.`);
  }
  const html = await res.text();
  if (html.includes("hiscoretitleframe") === false && html.length < 1000) {
    throw new Error("Unexpected hiscores response.");
  }
  return { username: rsn, kills: parseCompareHtml(html) };
}
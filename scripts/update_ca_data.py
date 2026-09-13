#!/usr/bin/env python3
"""
Actualiza data/final_data.json con las tareas de Combat Achievements actuales.

Fuente: https://oldschool.runescape.wiki/w/Combat_Achievements/All_tasks
(se parsea el HTML renderizado de la tabla completa)

- Se actualizan los campos que vienen del wiki:
    name, tier (y pts derivado), monster, type, description, comp
- Se PRESERVAN tus campos manuales:
    custom_score, price, requirements
- Las tareas NUEVAS se agregan con custom_score/price en null para que
  sepas que todavia no los ajustaste a mano.

Uso:
    python scripts/update_ca_data.py           # actualiza data/final_data.json
    python scripts/update_ca_data.py --dry-run  # preview sin escribir
    python scripts/update_ca_data.py --sin-precio   # lista tareas sin precio setteado
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

PAGE_URL = "https://oldschool.runescape.wiki/w/Combat_Achievements/All_tasks"
USER_AGENT = "katservices-ca-updater/1.0 (wiki sync)"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "final_data.json"

# Puntos por tarea segun el tier (igual que el modulo del wiki).
TIER_PTS = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
    "elite": 4,
    "master": 5,
    "grandmaster": 6,
}

WIKI_FIELDS = ("name", "tier", "pts", "monster", "type", "description")


class RowParser(HTMLParser):
    """Extrae de la tabla: para cada <tr data-ca-task-id="N"> sus celdas y data-sort-value."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[dict] = []
        self._row_id: int | None = None
        self._cells: list[str] | None = None
        self._current: list[str] | None = None
        self._pts: int | None = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tr":
            rid = attrs.get("data-ca-task-id")
            if rid is not None:
                self._row_id = int(rid)
                self._cells, self._current, self._pts = [], [], None
            elif self._row_id is not None and len(self._cells) == 6:
                self._close_row()
        elif tag == "td" and self._row_id is not None:
            self._current = []
            self._cells.append(self._current)
        elif tag == "span" and self._row_id is not None and self._current is not None:
            sv = attrs.get("data-sort-value")
            if sv is not None and sv.isdigit() and self._pts is None:
                self._pts = int(sv)

    def handle_endtag(self, tag):
        if tag == "tr" and self._row_id is not None:
            self._close_row()

    def handle_data(self, data):
        if self._current is not None:
            self._current.append(data)

    def _close_row(self):
        if self._row_id is not None:
            self.rows.append(
                {
                    "id": self._row_id,
                    "cells": ["".join(c).strip() for c in self._cells],
                    "pts": self._pts,
                }
            )
        self._row_id = None
        self._cells = None
        self._current = None
        self._pts = None

    @property
    def tasks(self) -> list[dict]:
        out = []
        for r in self.rows:
            cells = r["cells"]
            if len(cells) < 6:
                continue
            tier = cells[4].split("(")[0].strip()
            out.append(
                {
                    "wiki_ca_id": r["id"],
                    "name": cells[1],
                    "tier": tier,
                    "pts": r["pts"] if r["pts"] is not None else TIER_PTS.get(tier.lower(), 0),
                    "monster": cells[0],
                    "type": cells[3],
                    "description": html_mod.unescape(cells[2]),
                    "comp": parse_comp(cells[5]),
                }
            )
        out.sort(key=lambda t: t["wiki_ca_id"])
        return out


def parse_comp(text: str):
    text = text.strip()
    if not text or text in ("N/A", "-") or text.startswith("<0.1"):
        return None
    m = re.match(r"([\d.]+)", text)
    return float(m.group(1)) if m else None


def fetch_wiki_tasks() -> list[dict]:
    req = urllib.request.Request(PAGE_URL, headers={"User-Agent": USER_AGENT})
    html = urllib.request.urlopen(req, timeout=120).read().decode("utf-8")
    parser = RowParser()
    parser.feed(html)
    return parser.tasks


def build_new_task(wt: dict) -> dict:
    return {
        "name": wt["name"],
        "tier": wt["tier"],
        "pts": wt["pts"],
        "monster": wt["monster"],
        "type": wt["type"],
        "description": wt["description"],
        "comp": wt["comp"] if wt["comp"] is not None else 0,
        "custom_score": None,
        "price": None,
        "wiki_ca_id": wt["wiki_ca_id"],
    }


def merge(wiki_tasks, current):
    """Devuelve (merged, nuevas, modificadas, solo_comp, removidas) sin tocar el archivo."""
    current_by_id = {t["wiki_ca_id"]: t for t in current}
    wiki_by_id = {t["wiki_ca_id"]: t for t in wiki_tasks}

    new_tasks = []
    updated = []
    comp_only = []

    for wt in wiki_tasks:
        old = current_by_id.get(wt["wiki_ca_id"])
        if old is None:
            new_tasks.append(build_new_task(wt))
            continue

        changed = {}
        for key in WIKI_FIELDS:
            if old.get(key) != wt[key]:
                changed[key] = wt[key]
        if wt["comp"] is not None and old.get("comp") != wt["comp"]:
            changed["comp"] = wt["comp"]

        if changed:
            entry = dict(old)
            entry.update(changed)
            if set(changed) == {"comp"}:
                comp_only.append(entry)
            else:
                updated.append(entry)

    removed = [t for t in current if t["wiki_ca_id"] not in wiki_by_id]

    merged = list(current)
    merged.extend(new_tasks)
    merged.sort(key=lambda t: t["wiki_ca_id"])
    return merged, new_tasks, updated, comp_only, removed


def load_tasks() -> list[dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def write_json(tasks: list) -> None:
    DATA_PATH.write_text(
        json.dumps(tasks, ensure_ascii=False, indent=4) + "\n", encoding="utf-8"
    )


def list_unpriced() -> None:
    current = load_tasks()
    unpriced = [t for t in current if t.get("price") is None or t.get("price") == 0]
    if not unpriced:
        print("No hay tareas sin precio :)")
        return
    print(f"{len(unpriced)} tareas sin precio (price null o 0):")
    print(f"  {'id':<4} {'tier':<11} {'pts':<3}  {'nombre':<38} custom_score")
    for t in unpriced:
        t_id = t.get("wiki_ca_id", "?")
        tier = t.get("tier", "?")
        pts = t.get("pts", "?")
        name = t.get("name", "?")
        cs = t.get("custom_score", "?")
        print(f"  {t_id:<4} {tier:<11} {pts:<3}  {name:<38} {cs}")
    print("\nSettea price (en millones de GP) y custom_score (0-5) en data/final_data.json")


def do_update(dry_run: bool) -> None:
    print("Descargando la tabla del wiki...")
    wiki_tasks = fetch_wiki_tasks()
    print(f"  {len(wiki_tasks)} tareas en el wiki")

    current = load_tasks()
    print(f"\n=== {DATA_PATH} ({len(current)} tareas actuales) ===")

    merged, new_tasks, updated, comp_only, removed = merge(wiki_tasks, current)

    print(f"  tareas nuevas:        {len(new_tasks)}")
    for t in new_tasks:
        print(f"    [+] id={t['wiki_ca_id']:<4} {t['tier']:<11} {t['name']}")
    print(f"  datos modificados:    {len(updated)}")
    for t in updated[:15]:
        print(f"    [~] id={t['wiki_ca_id']:<4} {t['name']}")
    if len(updated) > 15:
        print(f"    ... y {len(updated) - 15} mas")
    print(f"  solo comp% actualizado: {len(comp_only)}")
    print(f"  tareas ya no listadas: {len(removed)}")
    for t in removed:
        print(f"    [-] id={t['wiki_ca_id']:<4} {t['name']}")

    if new_tasks or updated or comp_only or removed:
        if dry_run:
            print("  (dry-run: no se escribio nada)")
        else:
            write_json(merged)
            print(f"  -> escrito: {DATA_PATH} ({len(merged)} tareas)")
    else:
        print("  sin cambios :)")

    if new_tasks:
        print("\n" + "=" * 66)
        print("TAREAS NUEVAS agregadas con custom_score/price en null.")
        print("Ajustalas a mano en data/final_data.json:")
        print("  - custom_score : prioridad de recomendacion (0 = no recomendar, 5 = top)")
        print("  - price        : precio en millones de GP (ej: 12.5 = 12.5M)")
        print("  - requirements : si es de grupo agrega")
        print('                  "requirements": {"team_members": {"min": 2}}')
        print("                  (y skills si aplica). El wiki no provee este dato.")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Actualiza data/final_data.json con las tareas actuales del wiki."
    )
    ap.add_argument(
        "--dry-run", action="store_true", help="mostrar cambios sin escribir"
    )
    ap.add_argument(
        "--sin-precio",
        action="store_true",
        help="listar las tareas que aun no tienen precio (sin tocar nada)",
    )
    args = ap.parse_args()

    if not DATA_PATH.is_file():
        print(f"No existe el archivo de datos: {DATA_PATH}")
        return 1

    if args.sin_precio:
        list_unpriced()
        return 0

    do_update(args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
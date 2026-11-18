#!/usr/bin/env python3
"""Genera prospectos.csv y reporte.html a partir de los JSON de los agentes."""
import csv, json, re, html, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "raw")


def load(name, default):
    p = os.path.join(RAW, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)


scored = load("scored.json", {"prospectos": [], "descartados": []})
estr = load("estrategia.json", {})
msgs = load("mensajes.json", {"top10": []})
opps = load("oportunidades.json", {"proyectos": [], "observaciones_mercado": []})

pros = sorted(scored.get("prospectos", []), key=lambda p: -int(p.get("puntuacion", 0)))


def as_text(v):
    if isinstance(v, list):
        return "; ".join(str(x) for x in v)
    if isinstance(v, dict):
        return " | ".join(f"{k}: {u}" for k, u in v.items())
    return "" if v is None else str(v)


# ---------- CSV ----------
cols = ["puntuacion", "nombre", "giro", "direccion", "colonia", "telefono", "tiene_web",
        "señales", "razon_puntuacion", "fuentes"]
with open(os.path.join(BASE, "prospectos.csv"), "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(cols)
    for p in pros:
        w.writerow([as_text(p.get(c, "no encontrado")) for c in cols])

# ---------- Bitácora -> timeline ----------
timeline = []
with open(os.path.join(BASE, "bitacora.md"), encoding="utf-8") as f:
    cur = None
    for line in f:
        m = re.match(r"^## (\d{1,2}:\d{2}) UTC — (.*)", line)
        if m:
            cur = {"hora": m.group(1), "titulo": m.group(2).strip(), "items": []}
            timeline.append(cur)
        elif cur and line.strip().startswith("- "):
            cur["items"].append(line.strip()[2:])

# ---------- Data blob for HTML ----------
msg_by_name = {m.get("nombre", "").strip().lower(): m for m in msgs.get("top10", [])}
top10 = []
for p in pros[:10]:
    m = msg_by_name.get(p.get("nombre", "").strip().lower(), {})
    top10.append({**p, "whatsapp_msg": m.get("whatsapp", ""), "guion": m.get("guion", "")})

data = {
    "prospectos": pros,
    "top10": top10,
    "descartados": scored.get("descartados", []),
    "revisados": scored.get("revisados", len(pros) + len(scored.get("descartados", []))),
    "estrategia": estr,
    "oportunidades": opps,
    "timeline": timeline,
}
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")

with open(os.path.join(RAW, "template.html"), encoding="utf-8") as f:
    tpl = f.read()
page = tpl.replace("/*__DATA__*/null", blob)
with open(os.path.join(BASE, "reporte.html"), "w", encoding="utf-8") as f:
    f.write('<!doctype html>\n<html lang="es">\n' + page + "\n</html>\n")
with open(os.path.join(RAW, "artifact.html"), "w", encoding="utf-8") as f:
    f.write(page)

print(f"prospectos: {len(pros)}  top10 con mensaje: {sum(1 for t in top10 if t['whatsapp_msg'])}  timeline: {len(timeline)}")

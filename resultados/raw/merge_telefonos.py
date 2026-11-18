#!/usr/bin/env python3
"""Aplica raw/s2b_telefonos.json a raw/scored.json (ajusta solo el componente de contacto)."""
import json, os, re

RAW = os.path.dirname(os.path.abspath(__file__))
s = json.load(open(os.path.join(RAW, "scored.json"), encoding="utf-8"))
u = json.load(open(os.path.join(RAW, "s2b_telefonos.json"), encoding="utf-8"))
by = {p["nombre"]: p for p in s["prospectos"]}
log = []


def old_contact(p):
    t = str(p.get("telefono", "")).lower()
    al = " ".join(p.get("alertas") or []).lower()
    if "no encontrado" in t:
        return 0
    if "posible" in t or "dudoso" in al or "contradic" in al:
        return 5
    return 15


for a in u.get("actualizaciones", []):
    p = by.get(a.get("nombre"))
    if not p or not str(a.get("fuente", "")).startswith("http"):
        continue
    if a.get("cerrado") == "si":
        s["prospectos"].remove(p)
        s["descartados"].append({"nombre": p["nombre"], "giro_categoria": p.get("giro_categoria"),
                                 "motivo": f"Posiblemente cerrado (ronda 2B): {a.get('nota','')} {a['fuente']}"})
        log.append(f"DESCARTADO {p['nombre']}")
        continue
    tel = a.get("telefono_nuevo") or ""
    wa = a.get("whatsapp_nuevo") or ""
    if not (tel or wa):
        if a.get("web_encontrada"):
            p.setdefault("alertas", []).append(f"Posible web propia encontrada en ronda 2B: {a['web_encontrada']} (revisar)")
            log.append(f"WEB? {p['nombre']}")
        continue
    before = old_contact(p)
    new = 15 if (tel and a.get("confianza") == "alta") else 8
    if new <= before:
        p.setdefault("alertas", []).append(f"Teléfono alterno (ronda 2B): {tel or wa} — {a['fuente']}")
        continue
    prev_tel = p.get("telefono")
    if tel:
        p["telefono"] = tel
    if wa:
        p["whatsapp"] = wa
    p.setdefault("fuentes", {})["telefono"] = a["fuente"]
    p["puntuacion"] = int(p["puntuacion"]) + (new - before)
    p["razon_puntuacion"] += f"; ronda 2B: teléfono encontrado (contacto {before}→{new})"
    p.setdefault("alertas", []).append(f"Teléfono agregado en ronda 2B (antes: {prev_tel}); confianza {a.get('confianza')}")
    if a.get("web_encontrada"):
        p["alertas"].append(f"Posible web propia: {a['web_encontrada']} (revisar)")
    log.append(f"{p['nombre']}: +{new - before} → {p['puntuacion']}")

s["prospectos"].sort(key=lambda p: -int(p["puntuacion"]))
# respeta excluir_top10
top = [p for p in s["prospectos"] if not p.get("excluir_top10")][:10]
rest = [p for p in s["prospectos"] if p not in top]
s["prospectos"] = top + rest
s.setdefault("notas_proceso", []).append("Ronda 2B teléfonos: " + "; ".join(log))
json.dump(s, open(os.path.join(RAW, "scored.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\n".join(log))
print("top10:", [p["nombre"][:40] for p in s["prospectos"][:10]])

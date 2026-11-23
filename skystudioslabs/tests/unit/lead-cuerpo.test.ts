import { describe, it, expect } from "vitest";
import { camposDelCuerpo, leerCuerpoLimitado } from "@/lib/lead";

/** Stream en trozos (simula un envío "chunked" sin Content-Length). */
function flujo(trozos: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(c) {
      if (i < trozos.length) c.enqueue(enc.encode(trozos[i++]));
      else c.close();
    },
  });
}

describe("leerCuerpoLimitado", () => {
  it("lee completo si cabe", async () => {
    const b = await leerCuerpoLimitado(flujo(["hola ", "mundo"]), 100);
    expect(new TextDecoder().decode(b!)).toBe("hola mundo");
  });
  it("corta (null) en cuanto pasa del límite, aunque no haya Content-Length", async () => {
    let leidos = 0;
    const infinito = new ReadableStream<Uint8Array>({
      pull(c) {
        leidos++;
        c.enqueue(new Uint8Array(1024));
      },
    });
    expect(await leerCuerpoLimitado(infinito, 8 * 1024)).toBeNull();
    expect(leidos).toBeLessThan(20);
  });
  it("sin cuerpo → vacío", async () => {
    expect((await leerCuerpoLimitado(null, 10))!.byteLength).toBe(0);
  });
});

describe("camposDelCuerpo", () => {
  const enc = (s: string) => new TextEncoder().encode(s);
  it("JSON objeto", async () => {
    expect(await camposDelCuerpo(enc('{"nombre":"Ana"}'), "application/json")).toEqual({ nombre: "Ana" });
  });
  it("JSON que no es objeto → lanza", async () => {
    await expect(camposDelCuerpo(enc("[1]"), "application/json")).rejects.toThrow();
    await expect(camposDelCuerpo(enc("{"), "")).rejects.toThrow();
  });
  it("urlencoded", async () => {
    expect(await camposDelCuerpo(enc("nombre=Ana+P%C3%A9rez&negocio=Taller"), "application/x-www-form-urlencoded; charset=UTF-8")).toEqual({
      nombre: "Ana Pérez",
      negocio: "Taller",
    });
  });
  it("multipart: solo campos de texto (descarta archivos)", async () => {
    const f = new FormData();
    f.set("nombre", "Ana");
    f.set("archivo", new Blob(["x"]), "x.txt");
    const r = new Request("http://x", { method: "POST", body: f });
    const tipo = r.headers.get("content-type")!;
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect(await camposDelCuerpo(bytes, tipo)).toEqual({ nombre: "Ana" });
  });
});

import type { Metadata } from "next";
import { getRepo } from "@/lib/data";
import { alternatesPara, INICIO } from "@/lib/seo/metadata";
import { SceneIntro } from "@/components/scenes/SceneIntro";
import { SceneProblema } from "@/components/scenes/SceneProblema";
import { SceneTachado } from "@/components/scenes/SceneTachado";
import { SceneWeb } from "@/components/scenes/SceneWeb";
import { SceneMaps } from "@/components/scenes/SceneMaps";
import { SceneRedes } from "@/components/scenes/SceneRedes";
import { SceneChatbot } from "@/components/scenes/SceneChatbot";
import { SceneProceso } from "@/components/scenes/SceneProceso";
import { SceneConstelacion } from "@/components/scenes/SceneConstelacion";
import { ScenePrecios } from "@/components/scenes/ScenePrecios";
import { SceneCierre } from "@/components/scenes/SceneCierre";
import { SceneOrchestrator } from "@/components/scenes/SceneOrchestrator";
import s from "@/components/scenes/scenes.module.css";

/** El contador de sitios activos se refresca cada 5 minutos (ISR). */
export const revalidate = 300;

// Textos en lib/seo/metadata.ts (INICIO): los comparten <title>, Open Graph y Twitter.
export const metadata: Metadata = {
  title: { absolute: INICIO.titulo },
  description: INICIO.descripcion,
  alternates: alternatesPara("/"),
};

async function contarActivos(): Promise<number> {
  try {
    const repo = await getRepo();
    const n = await repo.contarSitiosActivos();
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/**
 * Home: TODO el contenido viene en el HTML del servidor (se lee bien sin JS).
 * <SceneOrchestrator /> solo agrega la animación encima (mejora progresiva).
 */
export default async function HomePage() {
  const activos = await contarActivos();
  return (
    <div className={s.home} data-home>
      <SceneIntro />
      <SceneProblema />
      <SceneTachado activos={activos} />
      <SceneWeb />
      <SceneMaps />
      <SceneRedes />
      <SceneChatbot />
      <SceneProceso />
      <SceneConstelacion activos={activos} />
      <ScenePrecios />
      <SceneCierre />
      <SceneOrchestrator />
    </div>
  );
}

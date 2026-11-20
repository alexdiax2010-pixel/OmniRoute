import type { MetadataRoute } from "next";
import type { Sitio } from "@/lib/types";
import { getRepo } from "@/lib/data";
import { construirSitemap } from "@/lib/seo/sitemap";
import { rootDomain, siteUrl } from "@/lib/seo/url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let sitios: Sitio[] = [];
  try {
    const repo = await getRepo();
    sitios = await repo.listarSitios();
  } catch {
    sitios = [];
  }
  return construirSitemap(sitios, siteUrl(), rootDomain());
}

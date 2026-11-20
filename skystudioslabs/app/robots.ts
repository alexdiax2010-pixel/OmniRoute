import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { construirRobots } from "@/lib/seo/sitemap";
import { rootDomain, siteUrl } from "@/lib/seo/url";

/** robots.txt se sirve en todos los subdominios: propuesta./admin./portal. responden "Disallow: /". */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return construirRobots(host, rootDomain(), siteUrl());
}

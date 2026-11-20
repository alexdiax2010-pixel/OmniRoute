import { serializarJsonLd } from "@/lib/seo/schema";

/** Pinta JSON-LD (schema.org) de forma segura: escapa "<" para no cerrar el <script>. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(data) }} />;
}

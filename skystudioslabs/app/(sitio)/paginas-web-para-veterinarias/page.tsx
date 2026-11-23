import { PlantillaSEO } from "@/components/seo/PlantillaSEO";
import { metadataSEO } from "@/lib/seo/metadata";

const SLUG = "paginas-web-para-veterinarias";

export const metadata = metadataSEO(SLUG);

export default function Page() {
  return <PlantillaSEO slug={SLUG} />;
}

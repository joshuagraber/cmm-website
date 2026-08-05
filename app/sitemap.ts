import type { MetadataRoute } from "next";
import { getAllMicrodoses } from "@/lib/microdoses";

const siteUrl = "https://www.coolmolecules.media";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const microdoses = await getAllMicrodoses();

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/microdoses`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...microdoses.map((microdose) => ({
      url: `${siteUrl}/microdoses/${microdose.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

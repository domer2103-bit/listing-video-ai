import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/blog";
import { COMPETITORS } from "@/lib/compareData";

const BASE_URL = "https://onlineviewing.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/for-sellers",
    "/for-airbnb-hosts",
    "/create",
    "/pricing",
    "/blog",
    "/compare",
    "/compare/best-ai-property-video-tools",
    "/privacy",
    "/terms",
  ];
  const staticEntries = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));

  const posts = await getAllPostsMeta();
  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
  }));

  const compareEntries = COMPETITORS.map((c) => ({
    url: `${BASE_URL}/compare/${c.slug}`,
    lastModified: new Date(`${c.lastVerified}T00:00:00Z`),
  }));

  return [...staticEntries, ...postEntries, ...compareEntries];
}

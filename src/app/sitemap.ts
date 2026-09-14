import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/blog";

const BASE_URL = "https://onlineviewing.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/airbnb", "/create", "/pricing", "/blog", "/privacy", "/terms"];
  const staticEntries = routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));

  const posts = await getAllPostsMeta();
  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
  }));

  return [...staticEntries, ...postEntries];
}

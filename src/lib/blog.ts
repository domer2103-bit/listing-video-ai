import { readFile, readdir } from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

/** File-based blog content — Markdown files with YAML frontmatter, same
 * "no database, keep it simple" philosophy as the rest of this app's
 * file-based stores. Posts live in content/blog/<slug>.md. */

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type Persona = "Sellers" | "Airbnb Hosts" | "General";

export interface BlogPostMeta {
  slug: string;
  title: string;
  meta_description: string;
  target_keyword: string;
  persona: Persona;
  date: string; // YYYY-MM-DD
}

export interface BlogPost extends BlogPostMeta {
  html: string;
}

async function readPostFile(slug: string): Promise<{ meta: BlogPostMeta; content: string }> {
  const raw = await readFile(path.join(CONTENT_DIR, `${slug}.md`), "utf-8");
  const { data, content } = matter(raw);
  return {
    meta: {
      slug,
      title: data.title,
      meta_description: data.meta_description,
      target_keyword: data.target_keyword,
      persona: data.persona as Persona,
      date: data.date,
    },
    content,
  };
}

export async function getAllSlugs(): Promise<string[]> {
  const files = await readdir(CONTENT_DIR);
  return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
}

/** Metadata only, sorted newest first — cheap enough to call for the index
 * page without parsing every post's Markdown body. */
export async function getAllPostsMeta(): Promise<BlogPostMeta[]> {
  const slugs = await getAllSlugs();
  const posts = await Promise.all(slugs.map(async (slug) => (await readPostFile(slug)).meta));
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { meta, content } = await readPostFile(slug);
    const html = (await marked.parse(content)) as string;
    return { ...meta, html };
  } catch {
    return null;
  }
}

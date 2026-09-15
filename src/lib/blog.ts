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

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
  faqs: FaqItem[];
}

/** Strips inline Markdown syntax down to plain text — used for FAQPage
 * JSON-LD, where Google expects plain answer text rather than HTML/MD. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every post has a "## Frequently asked questions" section formatted as
 * repeated `**Question?**\nAnswer.` pairs (verified across all 30 posts) —
 * parsed straight from the raw Markdown into FAQPage JSON-LD entries. */
function extractFaqs(markdown: string): FaqItem[] {
  const sections = markdown.split(/\n(?=## )/);
  const faqSection = sections.find((s) => /^## Frequently asked questions/i.test(s.trim()));
  if (!faqSection) return [];

  const body = faqSection.replace(/^## Frequently asked questions\s*/i, "");
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const faqs: FaqItem[] = [];
  for (const block of blocks) {
    const match = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/);
    if (!match) continue;
    const question = stripInlineMarkdown(match[1]);
    const answer = stripInlineMarkdown(match[2]);
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
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
    const faqs = extractFaqs(content);
    return { ...meta, html, faqs };
  } catch {
    return null;
  }
}

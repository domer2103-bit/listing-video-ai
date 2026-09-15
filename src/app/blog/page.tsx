import Link from "next/link";
import type { Metadata } from "next";
import { getAllPostsMeta, Persona } from "@/lib/blog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const canonical = page > 1 ? `/blog?page=${page}` : "/blog";

  return {
    title: "Blog",
    description: "Guides on AI-narrated property video — for sellers, agents, and Airbnb hosts.",
    alternates: { canonical },
  };
}

const PERSONA_STYLE: Record<Persona, { label: string; text: string; bg: string }> = {
  Sellers: { label: "For Sellers", text: "text-[#0F9B7A]", bg: "bg-[#00DEB0]/10" },
  "Airbnb Hosts": { label: "For Airbnb Hosts", text: "text-[#D93A3F]", bg: "bg-[#FF5A5F]/10" },
  General: { label: "General", text: "text-neutral-600", bg: "bg-neutral-100" },
};

const PAGE_SIZE = 10;

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const posts = await getAllPostsMeta();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Blog</h1>
        <p className="text-neutral-500">
          Guides on AI-narrated property video — for sellers, agents, and Airbnb hosts.
        </p>
      </header>

      <div className="space-y-8">
        {pagePosts.map((post) => {
          const style = PERSONA_STYLE[post.persona] ?? PERSONA_STYLE.General;
          return (
            <article key={post.slug} className="space-y-2 border-b border-neutral-100 pb-8 last:border-0">
              <div className="flex items-center gap-3 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="text-neutral-400">{formatDate(post.date)}</span>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">
                <Link href={`/blog/${post.slug}`} className="hover:text-[#0F9B7A]">
                  {post.title}
                </Link>
              </h2>
              <p className="text-neutral-600">{post.meta_description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block text-sm font-medium text-[#0F9B7A] underline underline-offset-2"
              >
                Read more
              </Link>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-4 text-sm">
          {page > 1 ? (
            <Link href={`/blog?page=${page - 1}`} className="text-[#0F9B7A] underline underline-offset-2">
              ← Newer posts
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/blog?page=${page + 1}`} className="text-[#0F9B7A] underline underline-offset-2">
              Older posts →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSlugs, getPostBySlug, Persona } from "@/lib/blog";
import { BlogPostBody } from "@/components/BlogPostBody";

const PERSONA_STYLE: Record<Persona, { label: string; text: string; bg: string }> = {
  Sellers: { label: "For Sellers", text: "text-[#0F9B7A]", bg: "bg-[#00DEB0]/10" },
  "Airbnb Hosts": { label: "For Airbnb Hosts", text: "text-[#D93A3F]", bg: "bg-[#FF5A5F]/10" },
  General: { label: "General", text: "text-neutral-600", bg: "bg-neutral-100" },
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = `https://onlineviewing.co.uk/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.meta_description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const style = PERSONA_STYLE[post.persona] ?? PERSONA_STYLE.General;
  const url = `https://onlineviewing.co.uk/blog/${post.slug}`;
  const publishedAt = `${post.date}T00:00:00Z`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    image: "https://onlineviewing.co.uk/opengraph-image",
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: { "@type": "Organization", name: "Online Viewing", url: "https://onlineviewing.co.uk" },
    publisher: {
      "@type": "Organization",
      name: "Online Viewing",
      url: "https://onlineviewing.co.uk",
      logo: { "@type": "ImageObject", url: "https://onlineviewing.co.uk/opengraph-image" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const faqSchema =
    post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div>
        <Link href="/blog" className="text-sm text-[#0F9B7A] underline underline-offset-2">
          ← Back to blog
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-3 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <span className="text-neutral-400">{formatDate(post.date)}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 leading-[1.15]">
          {post.title}
        </h1>
        <p className="text-lg text-neutral-500">{post.meta_description}</p>
      </header>

      <BlogPostBody
        html={post.html}
        slug={post.slug}
        className="text-neutral-700 space-y-4 leading-relaxed
          [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-neutral-900 [&_h1]:tracking-tight [&_h1]:mt-10 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_h2]:mt-8 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-900 [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4
          [&_li]:leading-relaxed
          [&_strong]:font-semibold [&_strong]:text-neutral-900
          [&_a]:text-[#0F9B7A] [&_a]:underline [&_a]:underline-offset-2
          [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-600
          [&_code]:bg-neutral-100 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm"
      />
    </main>
  );
}

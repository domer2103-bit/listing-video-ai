import Link from "next/link";
import { Fragment } from "react";

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const BARE_URL = /(https?:\/\/[^\s)]+)/g;

/** Renders chat message text with markdown-style [label](url) links (and
 * bare https:// URLs) turned into real clickable links — internal paths
 * use next/link, everything else is a plain anchor. */
export function ChatBubbleContent({ content, className }: { content: string; className?: string }) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of content.matchAll(MARKDOWN_LINK)) {
    const [full, label, url] = match;
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(...linkifyPlain(content.slice(lastIndex, index), key++));
    nodes.push(<ChatLink key={`link-${key++}`} href={url} className={className}>{label}</ChatLink>);
    lastIndex = index + full.length;
  }
  nodes.push(...linkifyPlain(content.slice(lastIndex), key++));

  return <>{nodes}</>;
}

function linkifyPlain(text: string, keySeed: number): React.ReactNode[] {
  const parts = text.split(BARE_URL);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <ChatLink key={`bare-${keySeed}-${i}`} href={part}>
        {part}
      </ChatLink>
    ) : (
      <Fragment key={`text-${keySeed}-${i}`}>{part}</Fragment>
    )
  );
}

function ChatLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const linkClassName = className ?? "underline underline-offset-2 font-medium";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClassName}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {children}
    </a>
  );
}

import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Renders a post body written in a small, deliberate subset of Markdown.
 *
 * A full Markdown library would let an editor paste raw HTML into a column that
 * ends up in the page — an injection waiting to happen on a site where the
 * admin account is the one thing between the CMS and the public. So the body is
 * parsed here into React elements, and anything not on this list renders as
 * plain text:
 *
 *   ## Heading            → a section heading
 *   ### Heading           → a sub-heading
 *   - item                → a list
 *   > quote               → a pull quote
 *   **bold**  *italic*    → emphasis
 *   [text](/path)         → a link; internal paths use the router
 *
 * No `dangerouslySetInnerHTML` anywhere, so nothing an editor types can become
 * markup.
 */
export function PostBody({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        switch (block.kind) {
          case "heading":
            return (
              <h2 key={key} className="display-3 mt-14 first:mt-0">
                {inline(block.text)}
              </h2>
            );
          case "subheading":
            return (
              <h3 key={key} className="lead mt-10 text-foreground">
                {inline(block.text)}
              </h3>
            );
          case "quote":
            return (
              <blockquote key={key} className="my-10 border-l-2 border-accent pl-8">
                <p className="lead max-w-measure text-foreground">{inline(block.text)}</p>
              </blockquote>
            );
          case "list":
            return (
              <ul key={key} className="mt-8 max-w-measure border-t border-border">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="body-text flex gap-5 border-b border-border py-4 text-muted-foreground"
                  >
                    <span aria-hidden="true" className="text-accent">
                      —
                    </span>
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={key} className="body-text mt-6 max-w-measure text-muted-foreground">
                {inline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

type Block =
  | { kind: "heading" | "subheading" | "quote" | "paragraph"; text: string }
  | { kind: "list"; items: string[] };

/** Splits a body into blocks. Consecutive `- ` lines collapse into one list. */
function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    for (const rawLine of chunk.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("- ")) {
        list.push(line.slice(2).trim());
        continue;
      }

      flushList();

      if (line.startsWith("### ")) blocks.push({ kind: "subheading", text: line.slice(4).trim() });
      else if (line.startsWith("## ")) blocks.push({ kind: "heading", text: line.slice(3).trim() });
      else if (line.startsWith("> ")) blocks.push({ kind: "quote", text: line.slice(2).trim() });
      else blocks.push({ kind: "paragraph", text: line });
    }
    flushList();
  }
  flushList();

  return blocks;
}

/** Matches a link, bold or italic run, in that order of precedence. */
const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Turns emphasis and links into elements, leaving everything else as text. */
function inline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const key = `${match.index}`;

    const [, linkText, href, bold, italic] = match;
    if (linkText && href) {
      nodes.push(<InlineLink key={key} href={href} label={linkText} />);
    } else if (bold) {
      nodes.push(
        <strong key={key} className="font-medium text-foreground">
          {bold}
        </strong>,
      );
    } else if (italic) {
      nodes.push(<em key={key}>{italic}</em>);
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}

/**
 * A link inside a post.
 *
 * Internal paths go through the router so navigation stays client-side and the
 * page transition plays. Anything else is treated as external and opens in a
 * new tab with `rel="noopener"`; `javascript:` and other schemes never reach an
 * href because only `http(s)` is allowed through.
 */
function InlineLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className="prose-link">
        {label}
      </Link>
    );
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="prose-link">
        {label}
      </a>
    );
  }

  return <>{label}</>;
}

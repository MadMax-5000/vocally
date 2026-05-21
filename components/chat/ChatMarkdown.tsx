"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/** `user` = light text on primary (coral). `userInk` = light text on ink bubble (inbox). */
export type ChatMarkdownVariant = "assistant" | "user" | "userInk" | "neutral";

type ChatMarkdownProps = {
  content: string;
  variant: ChatMarkdownVariant;
  className?: string;
};

/** Block unsafe hrefs (e.g. javascript:) while keeping http(s) / mailto / same-path links. */
function linkProps(href: string | undefined): {
  href: string;
  target?: string;
  rel?: string;
} | null {
  if (!href || href.trim() === "") return null;
  const t = href.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(t))
    return { href: t, target: "_blank", rel: "noopener noreferrer" };
  if (lower.startsWith("mailto:")) return { href: t };
  if (t.startsWith("/") && !t.startsWith("//")) return { href: t };
  if (lower.startsWith("#")) return { href: t };
  return null;
}

function buildComponents(variant: ChatMarkdownVariant): Components {
  const isUserPrimary = variant === "user";
  const isUserInk = variant === "userInk";
  const isUserBubble = isUserPrimary || isUserInk;

  const linkClass = isUserPrimary
    ? "font-medium text-on-primary underline decoration-white/50 underline-offset-2 hover:decoration-white"
    : isUserInk
      ? "font-medium text-canvas underline decoration-canvas/45 underline-offset-2 hover:decoration-canvas"
      : variant === "neutral"
        ? "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        : "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary";

  const strongClass = isUserPrimary
    ? "font-semibold text-on-primary"
    : isUserInk
      ? "font-semibold text-canvas"
      : "font-semibold text-ink";

  const inlineCodeClass = isUserBubble
    ? cn(
        "rounded px-1 py-0.5 font-mono text-[12.5px] bg-white/15",
        isUserPrimary ? "text-on-primary" : "text-canvas",
      )
    : "rounded px-1 py-0.5 font-mono text-[12.5px] bg-canvas-soft text-ink ring-1 ring-hairline/80";

  const blockPreClass = isUserBubble
    ? "my-2 overflow-x-auto rounded-md border border-white/25 bg-black/15 p-3"
    : "my-2 overflow-x-auto rounded-md border border-hairline bg-canvas-soft p-3";

  const blockCodeClass = isUserBubble
    ? cn(
        "block w-fit min-w-full font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words",
        isUserPrimary ? "text-on-primary" : "text-canvas",
      )
    : "block w-fit min-w-full font-mono text-[13px] leading-relaxed text-ink whitespace-pre-wrap break-words";

  const tableBorder = isUserBubble ? "border border-white/25" : "border border-hairline";

  const headingInk = isUserPrimary ? "text-on-primary" : isUserInk ? "text-canvas" : "text-ink";

  const listMarkerUl = isUserPrimary
    ? "[li]:marker:text-on-primary/70"
    : isUserInk
      ? "[li]:marker:text-canvas/70"
      : "[li]:marker:text-muted";

  const listMarkerOl = isUserPrimary
    ? "[li]:marker:text-on-primary/75"
    : isUserInk
      ? "[li]:marker:text-canvas/75"
      : "[li]:marker:text-muted-soft";

  return {
    p: ({ children, ...props }) => (
      <p className="mb-2 leading-relaxed last:mb-0 [&:first-child]:mt-0" {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong className={strongClass} {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em
        className={cn(
          "italic opacity-95",
          isUserPrimary && "text-on-primary/95",
          isUserInk && "text-canvas/95",
        )}
        {...props}
      >
        {children}
      </em>
    ),
    a: ({ href, children, ...props }) => {
      const safe = linkProps(typeof href === "string" ? href : undefined);
      if (!safe) {
        return <span className="text-inherit">{children}</span>;
      }
      return (
        <a className={linkClass} {...safe} {...props}>
          {children}
        </a>
      );
    },
    ul: ({ children, ...props }) => (
      <ul className={cn("mb-2 list-disc space-y-1 pl-5", listMarkerUl)} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className={cn("mb-2 list-decimal space-y-1 pl-5 [li]:marker:font-medium", listMarkerOl)}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed [&>p]:mb-1 [&>p:last-child]:mb-0" {...props}>
        {children}
      </li>
    ),
    h1: ({ children, ...props }) => (
      <h1
        className={cn(
          "mb-2 mt-3 font-display text-base font-semibold tracking-tight first:mt-0",
          headingInk,
        )}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className={cn("mb-2 mt-3 text-[15px] font-semibold first:mt-0", headingInk)} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className={cn("mb-1.5 mt-2.5 text-sm font-semibold first:mt-0", headingInk)} {...props}>
        {children}
      </h3>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className={
          isUserPrimary
            ? "my-2 border-l-2 border-white/35 pl-3 text-on-primary/90"
            : isUserInk
              ? "my-2 border-l-2 border-canvas/35 pl-3 text-canvas/90"
              : "my-2 border-l-2 border-hairline-strong pl-3 text-muted"
        }
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: (props) => (
      <hr
        className={isUserBubble ? "my-3 border-white/25" : "my-3 border-hairline"}
        {...props}
      />
    ),
    table: ({ children, ...props }) => (
      <div className="my-2 max-w-full overflow-x-auto rounded-md">
        <table className={cn("w-full min-w-[240px] border-collapse text-[13px]", tableBorder)} {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className={isUserBubble ? "bg-white/10" : "bg-surface-strong"} {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className={cn("px-2.5 py-1.5 text-left font-semibold", tableBorder)} {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className={cn("px-2.5 py-1.5", tableBorder)} {...props}>
        {children}
      </td>
    ),
    tr: (props) => <tr {...props} />,
    tbody: (props) => <tbody {...props} />,
    pre: ({ children, ...props }) => (
      <pre className={blockPreClass} {...props}>
        {children}
      </pre>
    ),
    code: ({ className, children, ...props }) => {
      const childText =
        typeof children === "string"
          ? children
          : Array.isArray(children)
            ? children.map((c) => (typeof c === "string" ? c : "")).join("")
            : "";
      const hasLanguageHint =
        typeof className === "string" && /\blanguage-[\w-]+\b/.test(className);
      /** Unlabeled fenced blocks still use `pre`; they often omit `language-*` but contain newlines. */
      const isBlock = hasLanguageHint || childText.includes("\n");
      if (isBlock) {
        return (
          <code className={cn(blockCodeClass, className)} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className={inlineCodeClass} {...props}>
          {children}
        </code>
      );
    },
    /** Task lists (GFM) — checkbox + label row */
    input: ({ checked, ...props }) => (
      <input
        type="checkbox"
        className="mr-2 align-middle"
        checked={Boolean(checked)}
        disabled
        readOnly
        {...props}
      />
    ),
  };
}

function rootClassForVariant(variant: ChatMarkdownVariant): string {
  switch (variant) {
    case "user":
      return "break-words text-sm text-on-primary [&_.task-list-item]:list-none [&_ul.task-list]:list-none [&_ul.task-list]:pl-0";
    case "userInk":
      return "break-words text-sm text-canvas [&_.task-list-item]:list-none [&_ul.task-list]:list-none [&_ul.task-list]:pl-0";
    case "neutral":
      return "break-words text-[13px] text-ink [&_.task-list-item]:list-none [&_ul.task-list]:list-none [&_ul.task-list]:pl-0";
    default:
      return "break-words text-sm text-ink [&_.task-list-item]:list-none [&_ul.task-list]:list-none [&_ul.task-list]:pl-0";
  }
}

/**
 * Renders markdown in chat bubbles. HTML in source is escaped (no rehype-raw).
 * Models often emit **bold**, lists, and fenced code — styled with DESIGN.md tokens per variant.
 */
export function ChatMarkdown({ content, variant, className }: ChatMarkdownProps) {
  const components = buildComponents(variant);

  return (
    <div className={cn(rootClassForVariant(variant), "[&_*]:max-w-full", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

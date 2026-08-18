"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// AI release notes and PR summaries come back as markdown. Rendering them raw
// prints "#####" and "*" literally, so every consumer goes through this.
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mt-4 text-[14px] font-semibold text-foreground first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-4 text-[14px] font-semibold text-foreground first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-4 text-[13px] font-semibold text-foreground first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mt-3.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground first:mt-0">{children}</h4>,
          h5: ({ children }) => <h5 className="mt-3.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground first:mt-0">{children}</h5>,
          h6: ({ children }) => <h6 className="mt-3.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground first:mt-0">{children}</h6>,
          p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-2 space-y-1 first:mt-0">{children}</ul>,
          ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 first:mt-0">{children}</ol>,
          li: ({ children }) => (
            <li className="relative pl-4 before:absolute before:left-1 before:top-[0.55em] before:size-1 before:rounded-full before:bg-primary marker:text-muted-foreground [ol_&]:pl-0 [ol_&]:before:hidden">
              {children}
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[12px]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface p-3 font-mono text-[12px]">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-2 border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          table: ({ children }) => (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-surface px-2 py-1 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

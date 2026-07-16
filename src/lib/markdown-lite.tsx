import { Fragment } from "react";

// Markdown-lite: **bold**, blank line = paragraph, "- " = bullet. Nothing else.
// Renders safe React output (no HTML injection).

export interface RenderedBlock {
  type: "paragraph" | "bullet";
  children: Array<{ text: string; bold?: boolean }>;
}

function parseInline(line: string): Array<{ text: string; bold?: boolean }> {
  const out: Array<{ text: string; bold?: boolean }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out.length ? out : [{ text: line }];
}

export function parseMarkdownLite(text: string): RenderedBlock[] {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: RenderedBlock[] = [];
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (!paraBuffer.length) return;
    const merged = paraBuffer.join(" ").trim();
    paraBuffer = [];
    if (!merged) return;
    blocks.push({ type: "paragraph", children: parseInline(merged) });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); continue; }
    const b = line.match(/^-\s+(.*)$/);
    if (b) {
      flushPara();
      blocks.push({ type: "bullet", children: parseInline(b[1]) });
    } else {
      paraBuffer.push(line);
    }
  }
  flushPara();
  return blocks;
}

export function RenderMarkdownLite({ text, className }: { text: string; className?: string }) {
  const blocks = parseMarkdownLite(text);
  const bullets: RenderedBlock[] = [];
  const nodes: React.ReactNode[] = [];

  const flushBullets = (key: string) => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${key}`} className="list-disc pl-6 space-y-2 my-4">
        {bullets.map((b, i) => (
          <li key={i}>
            {b.children.map((c, j) => (
              <Fragment key={j}>
                {c.bold ? <strong>{c.text}</strong> : c.text}
              </Fragment>
            ))}
          </li>
        ))}
      </ul>
    );
    bullets.length = 0;
  };

  blocks.forEach((block, idx) => {
    if (block.type === "bullet") {
      bullets.push(block);
    } else {
      flushBullets(`b-${idx}`);
      nodes.push(
        <p key={idx} className="my-4 leading-relaxed">
          {block.children.map((c, j) => (
            <Fragment key={j}>
              {c.bold ? <strong>{c.text}</strong> : c.text}
            </Fragment>
          ))}
        </p>
      );
    }
  });
  flushBullets("last");

  return <div className={className}>{nodes}</div>;
}

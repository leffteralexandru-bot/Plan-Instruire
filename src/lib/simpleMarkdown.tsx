/** Randare Markdown simplă — titluri, liste, bold, paragrafe */
import type { ReactNode } from 'react';

export function SimpleMarkdown({ source }: { source: string }) {
  if (!source.trim()) {
    return <p className="text-sm text-corporate-muted italic">Conținut necompletat de HR.</p>;
  }

  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc list-inside space-y-1 text-sm text-corporate-dark">
        {listItems.map((item, i) => (
          <li key={i} className="leading-relaxed">
            <InlineMd text={item} />
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h4 key={`h-${key++}`} className="text-sm font-semibold text-corporate-dark mt-3 first:mt-0">
          {trimmed.slice(3)}
        </h4>,
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h3 key={`h1-${key++}`} className="text-base font-semibold text-corporate-dark mt-2 first:mt-0">
          {trimmed.slice(2)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    blocks.push(
      <p key={`p-${key++}`} className="text-sm text-corporate-dark leading-relaxed">
        <InlineMd text={trimmed} />
      </p>,
    );
  }
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-corporate-dark">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

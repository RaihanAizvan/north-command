import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer" style={{ color: 'var(--amber)' }}>
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(91,102,117,0.25)',
              padding: '2px 6px',
              borderRadius: 8,
            }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(91,102,117,0.25)',
              padding: 10,
              borderRadius: 10,
              overflow: 'auto',
            }}
          >
            {children}
          </pre>
        ),
        ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: 18 }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: 18 }}>{children}</ol>,
        p: ({ children }) => <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>{children}</p>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

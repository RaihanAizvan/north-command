import React from 'react';

export function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="hdrSvg" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

export function MenuIcon() {
  return (
    <Icon>
      <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" fill="currentColor" />
    </Icon>
  );
}

export function BellIcon() {
  return (
    <Icon>
      <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 0 0-5.2-6.78V3a1.8 1.8 0 1 0-3.6 0v1.22A7 7 0 0 0 5 11v4.8l-1.6 1.6v.6h17.2v-.6L19 15.8Z" fill="currentColor" />
    </Icon>
  );
}

export function ChatIcon() {
  return (
    <Icon>
      <path d="M20 3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3v3l4.2-3H20a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" fill="currentColor" />
    </Icon>
  );
}

export function SnowIcon() {
  return (
    <Icon>
      <path d="M12 2v20M4 6l16 12M20 6L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Icon>
  );
}

export function TreeIcon() {
  return (
    <Icon>
      <path d="M12 2 7 9h3l-4 6h4l-3 5h10l-3-5h4l-4-6h3L12 2Z" fill="currentColor" />
    </Icon>
  );
}

export function ChevronRight() {
  return (
    <Icon>
      <path d="M9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

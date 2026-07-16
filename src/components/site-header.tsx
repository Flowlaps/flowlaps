import Link from "next/link";
import type { ReactNode } from "react";

interface SiteHeaderProps {
  logoHref: string;
  children: ReactNode;
}

/**
 * Always renders in the dark "night session" palette, independent of the
 * page it sits on top of. The header is the one element a user's eye stays
 * on across a marketing-to-app navigation, so keeping it visually constant
 * smooths the light/dark seam instead of the whole screen flipping at once.
 */
export function SiteHeader({ logoHref, children }: SiteHeaderProps) {
  return (
    <header className="theme-night border-b border-border bg-background text-foreground">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href={logoHref} className="text-lg font-semibold tracking-tight">
          Flowlaps
        </Link>
        {children}
      </div>
    </header>
  );
}

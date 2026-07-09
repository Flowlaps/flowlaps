import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/import", label: "Import" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Flowlaps
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

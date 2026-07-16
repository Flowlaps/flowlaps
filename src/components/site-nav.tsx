import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/import", label: "Import" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  return (
    <SiteHeader logoHref="/dashboard">
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
    </SiteHeader>
  );
}

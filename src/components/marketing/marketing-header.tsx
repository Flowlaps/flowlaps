import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <SiteHeader logoHref="/">
      <Link href="#waitlist" className={buttonVariants({ size: "sm" })}>
        Join the waitlist
      </Link>
    </SiteHeader>
  );
}

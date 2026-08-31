"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, House, UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/", label: t("navHome"), icon: House },
    { href: "/following", label: t("navFollowing"), icon: Users },
    { href: "/followers", label: t("navFollowers"), icon: UserCheck },
    { href: "/profile", label: t("navProfile"), icon: CircleUser },
  ] as const;

  return (
    <nav
      aria-label={t("brand")}
      className="shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/non-followers")
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 px-2 py-2.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={active ? 2 : 1.5}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

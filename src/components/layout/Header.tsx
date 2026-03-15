"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./UserNav";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isDashboardRoute = pathname.startsWith("/dashboard");

  const baseClasses =
    "flex items-center justify-between px-6 border-b border-navbar-accent/20 bg-navbar backdrop-blur supports-[backdrop-filter]:bg-navbar/95";

  return (
    <nav
      className={`${baseClasses} ${
        isDashboardRoute ? "absolute top-0 left-0 w-full h-[42px] z-50" : "h-[42px]"
      }`}
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-xl font-semibold text-yellow-text"
      >
        <Image
          src="/logo.ico"
          alt="Datamat"
          width={120}
          height={32}
          className="h-6 w-8"
        />
        Datamat
      </Link>

      <div className="flex items-center gap-4">{user && <UserNav />}</div>
    </nav>
  );
}


"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./UserNav";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isDashboardOrResources = pathname.startsWith("/dashboard") || pathname.startsWith("/resources");

  const baseClasses =
    "flex items-center justify-between px-6 border-b border-navbar-accent/20 bg-navbar backdrop-blur supports-[backdrop-filter]:bg-navbar/95";

  return (
    <nav
      className={`${baseClasses} absolute top-0 left-0 w-full h-[42px] z-50`}
    >
      <Link
        href="/"
        className="flex items-center gap-2"
      >
        <Image
          src="/logo.png"
          alt="Datamat"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="text-2xl font-datamat font-[700] leading-none -mb-1 tracking-tight">
          DATA<span className="text-yellow-text">MAT</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">{user && <UserNav />}</div>
    </nav>
  );
}


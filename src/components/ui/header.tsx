"use client";

import { UserNav } from "./user-nav";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Se a rota for a do dashboard, renderiza a navbar fixa no topo
  if (pathname === "/dashboard") {
    return (
      <nav className="flex items-center justify-between px-6 border-b border-navbar-accent/20 bg-navbar backdrop-blur supports-[backdrop-filter]:bg-navbar/95 absolute top-0 left-0 w-full h-[42px] z-50">
        <Link
          href="/"
          className="text-xl font-semibold text-[#FFB03F] flex items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt="Datamat"
            width={120}
            height={32}
            className="h-6 w-auto"
          />
          Datamat
        </Link>

        <div className="flex items-center gap-4">{user && <UserNav />}</div>
      </nav>
    );
  }

  // Se não for a rota do dashboard, renderize o Header normalmente
  return (
    <nav className="flex h-[42px] items-center justify-between px-6 border-b border-navbar-accent/20 bg-navbar backdrop-blur supports-[backdrop-filter]:bg-navbar/95">
      <Link
        href="/"
        className="text-xl font-semibold text-[#FFB03F] flex items-center gap-2"
      >
        <Image
          src="/logo.png"
          alt="Datamat"
          width={120}
          height={32}
          className="h-6 w-auto"
        />
        Datamat
      </Link>

      <div className="flex items-center gap-4">{user && <UserNav />}</div>
    </nav>
  );
}


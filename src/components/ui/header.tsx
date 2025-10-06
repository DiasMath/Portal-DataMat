"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./user-nav";
import Link from "next/link";

export function Header() {
  const { user } = useAuth();

  return (
    <nav className="flex h-16 items-center justify-between border-b px-6 transition-colors duration-300 bg-blue-600">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-semibold text-white hover:text-blue-100">
          Sistema de Análise
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && <UserNav />}
      </div>
    </nav>
  );
}

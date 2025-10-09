"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "./user-nav";
import Link from "next/link";
import { ChartColumnIncreasing } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <nav className="flex h-16 items-center justify-between px-6 border-b border-navbar-accent/20 bg-navbar backdrop-blur supports-[backdrop-filter]:bg-navbar/95">
      <div className="flex items-center gap-2">
        <ChartColumnIncreasing className="text-navbar-foreground" />
        <Link href="/" className="text-xl font-semibold text-navbar-foreground">
          Home
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && <UserNav />}
      </div>
    </nav>
  );
}

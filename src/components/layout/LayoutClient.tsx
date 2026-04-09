"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/unauthorized" || pathname.startsWith("/auth/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
    </>
  );
}
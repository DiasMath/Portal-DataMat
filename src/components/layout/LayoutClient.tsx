"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/unauthorized" || pathname.startsWith("/auth/");
  const isStudioEditor = pathname.startsWith("/studio") && !pathname.includes("/viewer");
  const isStudioViewer = pathname.startsWith("/studio") && pathname.includes("/viewer");

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isStudioEditor) {
    return <div className="h-[100vh] overflow-hidden">{children}</div>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
    </>
  );
}
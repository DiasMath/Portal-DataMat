"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);
  const isLoginPage = pathname === "/login" || pathname === "/forgot-password" || pathname === "/unauthorized" || pathname.startsWith("/auth/");
  const isStudioEditor = pathname.startsWith("/studio") && !pathname.includes("/viewer");
  const isStudioViewer = pathname.startsWith("/studio") && pathname.includes("/viewer");

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isStudioEditor) {
    return <div className="h-[100vh] overflow-hidden">{children}</div>;
  }

  if (isStudioViewer) {
    return (
      <div className="h-[100vh] overflow-hidden flex flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
    </>
  );
}
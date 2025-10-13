"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Dashboard() {
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const dashboardUrlFromQuery = searchParams.get('url');
  const [dashboardLink, setDashboardLink] = useState<string | null | undefined>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const link = dashboardUrlFromQuery || userData?.dashboardLink;
    setDashboardLink(link);
    setIsLoading(false);
  }, [userData, dashboardUrlFromQuery]);

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Carregando seu dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!dashboardLink) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Sem Dashboard Configurado
          </h2>
          <p className="text-muted-foreground">
            Você tem acesso ao sistema, mas ainda não possui um dashboard
            configurado.
            <br />
            Entre em contato com o administrador para mais informações.
          </p>
        </div>
      </main>
    );
  }

  // Add Power BI iframe optimization parameters
  const optimizeUrl = (url: string) => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}chromeless=1&navContentPaneEnabled=false`;
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
      <iframe
        title="Dashboard do Power BI"
        src={optimizeUrl(dashboardLink)}
        className="w-full h-full border-0"
        width="600" height="373.5"
        allowFullScreen
        loading="lazy"
      />

      <div className="absolute bottom-0 left-0 w-full h-[108px] bg-white"></div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <Suspense fallback={<div>Carregando...</div>}>
        <Dashboard />
      </Suspense>
    </ProtectedRoute>
  );
}

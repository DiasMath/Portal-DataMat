"use client";

import React, { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import type { IEmbedConfiguration } from "powerbi-client";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

// Desabilita pré-renderização estática desta página
export const dynamic = "force-dynamic";

// Importação dinâmica para evitar erro "self is not defined" no SSR
const PowerBIEmbed = dynamicImport(
  () => import("powerbi-client-react").then((mod) => mod.PowerBIEmbed),
  { ssr: false }
);

const isDev = process.env.NODE_ENV !== "production";

interface EmbedInfo {
  accessToken: string;
  embedUrl: string;
  embedReportId: string;
}

function CompanyDashboardEmbedPage() {
  const { isMasterAdmin } = useAuth();
  const params = useParams<{ companyId: string; dashboardId: string }>();
  const router = useRouter();

  const [embedConfig, setEmbedConfig] = useState<IEmbedConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.companyId || !params?.dashboardId) return;

    async function fetchEmbedInfo() {
      try {
        setLoading(true);
        setError(null);

        const { models } = await import("powerbi-client");

        const response = await fetch(
          `/api/powerbi/get-embed-info/${params.companyId}/${params.dashboardId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Falha ao buscar dados: ${response.statusText}`
          );
        }

        const data: EmbedInfo = await response.json();

        const config: IEmbedConfiguration = {
          type: "report",
          tokenType: models.TokenType.Embed,
          accessToken: data.accessToken,
          embedUrl: data.embedUrl,
          id: data.embedReportId,
          settings: {
            panes: {
              pageNavigation: { visible: false },
              filters: { visible: true },
            },
            bars: {
              actionBar: { visible: false },
              statusBar: { visible: false },
            },
          },
        };

        setEmbedConfig(config);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro ao incorporar relatório:", errorMessage);
        setError(`Erro ao carregar relatório: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    if (isMasterAdmin) {
      fetchEmbedInfo();
    }
  }, [params?.companyId, params?.dashboardId, isMasterAdmin]);

  if (!isMasterAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para visualizar esta página.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg">
        Carregando Relatório...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg text-red-600">
        {error}
      </div>
    );
  }

  return (
    embedConfig && (
      <div className="h-screen w-screen overflow-hidden relative">
        <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={new Map([
            [
              "loaded",
              () => {
                if (isDev) {
                  console.log("Relatório carregado.");
                }
              },
            ],
            ["error", (event?: { detail?: unknown }) => console.error("Erro do Power BI:", event?.detail)],
          ])}
          cssClassName="h-full w-full"
        />
      </div>
    )
  );
}

export default function ProtectedCompanyDashboardEmbedPage() {
  return (
    <ProtectedRoute requireMasterAdmin>
      <CompanyDashboardEmbedPage />
    </ProtectedRoute>
  );
}


"use client";

import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import type { IEmbedConfiguration } from "powerbi-client";
import { useParams } from "next/navigation";
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
  const { isMasterAdmin, userData } = useAuth();
  const params = useParams<{ companyId: string; dashboardId: string }>();

  const [embedConfig, setEmbedConfig] = useState<IEmbedConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.companyId || !params?.dashboardId || !userData) return;

    async function fetchEmbedInfo() {
      try {
        setLoading(true);
        setError(null);

        // --- VALIDAÇÃO DE PERMISSÕES ANTES DE CARREGAR O RELATÓRIO ---
        let hasAccess = false;

        if (isMasterAdmin) {
          hasAccess = true;
        } else {
          const canViewList = userData?.permissions?.canViewDashboardList;
          const companyAccess = userData?.permissions?.allowedDashboards?.[params.companyId];
          const hasGranularAccess = companyAccess === "all" || (Array.isArray(companyAccess) && companyAccess.includes(params.dashboardId));

          if (canViewList) {
            // Se ele TEM acesso à lista, ele pode ver qualquer dashboard
            hasAccess = true;
          } else if (hasGranularAccess) {
            // Se ele tem permissão granular para este dashboard específico, tem acesso
            hasAccess = true;
          } else {
            // Se ele NÃO tem acesso à lista nem granular, é um utilizador operacional de acesso direto
            // Regra 1: Só pode aceder se o link for da própria empresa dele
            if (params.companyId === userData?.companyId) {
              if (userData?.defaultDashboardId) {
                // Regra 2: Se lhe foi atribuído um painel fixo, ele SÓ pode ver esse painel
                hasAccess = params.dashboardId === userData.defaultDashboardId;
              } else {
                // Regra 3: Se não tem painel fixo, ele foi redirecionado para o padrão da empresa, logo tem acesso
                hasAccess = true;
              }
            }
          }
        }

        if (!hasAccess) {
          setError("Acesso Negado: Você não tem permissão para visualizar este dashboard.");
          setLoading(false);
          return;
        }
        // --------------------------------------------------------------

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

    fetchEmbedInfo();

  }, [params?.companyId, params?.dashboardId, isMasterAdmin, userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-text mx-auto" />
          <p className="text-muted-foreground font-body text-sm">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-heading font-bold text-foreground">Acesso Restrito</h2>
            <p className="text-muted-foreground font-body text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:border-yellow-text hover:text-yellow-text transition-colors font-heading text-sm"
          >
            Voltar
          </button>
        </div>
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
    <ProtectedRoute>
      <CompanyDashboardEmbedPage />
    </ProtectedRoute>
  );
}


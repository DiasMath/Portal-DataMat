"use client";

import { useState, useEffect } from "react";
import dynamicImport from "next/dynamic";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, orderBy, query, where, limit, getDocs as getDocsTyped } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Desabilita pré-renderização estática desta página
export const dynamic = "force-dynamic";

interface EmbedInfo {
  accessToken: string;
  embedUrl: string;
  embedReportId: string;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

function MasterAdminCompaniesView() {
  const { isMasterAdmin, userData } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        setError(null);

        const q = query(collection(db, "companies"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        let data: Company[] = snapshot.docs.map((doc) => {
          const d = doc.data() as Partial<Company>;
          return {
            id: doc.id,
            name: d.name ?? doc.id,
            description: d.description,
            active: d.active ?? true,
          };
        });

        // Filtrar as empresas caso não seja master_admin
        if (!isMasterAdmin && userData?.permissions?.allowedDashboards) {
          data = data.filter(company => 
            userData.permissions!.allowedDashboards[company.id] !== undefined
          );
        }

        setCompanies(data);
      } catch (err) {
        console.error("Erro ao carregar empresas:", err);
        setError("Não foi possível carregar a lista de empresas.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-16 pb-8 md:px-8 bg-background">
      <div className="max-w-4xl space-y-6">
        {companies.length === 0 ? (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Nenhuma empresa cadastrada</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard/${company.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg hover:border-yellow-text cursor-pointer transition-all">
                  <CardHeader className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 p-2">
                      <Building2 className="h-4 w-4 text-primary" />
                    </span>
                    <CardTitle className="text-base">{company.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardPage() {
  const { isMasterAdmin, userData, companyId } = useAuth();
  const router = useRouter();

  // Verifica se pode ver a lista
  const canViewList = isMasterAdmin || userData?.permissions?.canViewDashboardList;

  if (canViewList) {
    return <MasterAdminCompaniesView />;
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToDefaultDashboard() {
      try {
        if (!companyId) {
          setError("Usuário não está associado a nenhuma empresa (companyId).");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // 1. Tenta redirecionar para o dashboard ESPECÍFICO do usuário
        if (userData?.defaultDashboardId) {
          router.replace(`/dashboard/${companyId}/${userData.defaultDashboardId}`);
          return;
        }

        const dashboardsRef = collection(db, "dashboards");

        const q = query(
          dashboardsRef,
          where("companyId", "==", companyId),
          where("active", "==", true),
          where("isDefault", "==", true),
          limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError(
            "Nenhum dashboard foi configurado para o seu usuário. Peça para um administrador configurar o seu acesso."
          );
          setLoading(false);
          return;
        }

        const dashboardDoc = snapshot.docs[0];
        const dashboardId = dashboardDoc.id;

        router.replace(`/dashboard/${companyId}/${dashboardId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro ao localizar dashboard:", errorMessage);
        setError(`Erro ao localizar dashboard: ${errorMessage}`);
        setLoading(false);
      }
    }

    redirectToDefaultDashboard();
  }, [companyId, userData?.defaultDashboardId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg">
        Carregando seu painel...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg text-red-600 text-center px-4">
        {error}
      </div>
    );
  }

  return null;
}

// Exportação padrão com o Wrapper de Rota Protegida
export default function ProtectedDashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
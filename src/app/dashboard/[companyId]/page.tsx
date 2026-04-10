"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
}

function CompanyDashboardsPage() {
  const { isMasterAdmin, userData } = useAuth();
  const params = useParams<{ companyId: string }>();
  
  // Verificações de Permissão
  const canViewList = isMasterAdmin || userData?.permissions?.canViewDashboardList;
  const companyAccess = isMasterAdmin ? "all" : userData?.permissions?.allowedDashboards?.[params?.companyId ?? ""];
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.companyId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const companyRef = doc(db, "companies", params.companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          setError("Empresa não encontrada.");
          setLoading(false);
          return;
        }

        const companyData = companySnap.data() as Partial<Company>;
        setCompany({
          id: companySnap.id,
          name: companyData.name ?? companySnap.id,
        });

        const q = query(
          collection(db, "dashboards"),
          where("companyId", "==", params.companyId)
        );
        const dashboardsSnap = await getDocs(q);

        let dashboardsData: Dashboard[] = dashboardsSnap.docs.map((docSnap) => {
          const d = docSnap.data() as Partial<Dashboard>;
          return {
            id: docSnap.id,
            name: d.name ?? docSnap.id,
            description: d.description,
          };
        });

        // Filtra os dashboards que o utilizador pode ver nesta empresa
        if (!isMasterAdmin && companyAccess !== "all") {
          const allowedList = Array.isArray(companyAccess) ? companyAccess : [];
          dashboardsData = dashboardsData.filter(d => allowedList.includes(d.id));
        }

        setDashboards(dashboardsData);
      } catch (err) {
        console.error("Erro ao carregar dashboards da empresa:", err);
        setError("Não foi possível carregar os dashboards desta empresa.");
      } finally {
        setLoading(false);
      }
    }

    // Só busca os dados se tiver permissão de ver a lista e o acesso da empresa já estiver carregado
    if (canViewList && companyAccess !== undefined) {
      fetchData();
    }
  }, [params?.companyId, canViewList, companyAccess, isMasterAdmin]);

  if (!canViewList || companyAccess === undefined) {
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
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para clientes
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pt-12 pb-8 md:px-8 bg-background">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">
              Dashboards – {company?.name ?? "Empresa"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecione um dashboard para visualizar o relatório do Power BI.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </header>

        {dashboards.length === 0 ? (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Nenhum dashboard cadastrado</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="hover:shadow-lg hover:border-yellow-text cursor-pointer transition-all"
                onClick={() =>
                  router.push(`/dashboard/${company!.id}/${dashboard.id}`)
                }
              >
                <CardHeader className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </span>
                  <CardTitle className="text-base">{dashboard.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProtectedCompanyDashboardsPage() {
  return (
    <ProtectedRoute>
      <CompanyDashboardsPage />
    </ProtectedRoute>
  );
}


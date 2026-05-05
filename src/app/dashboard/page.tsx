"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

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
        }).filter(c => c.active !== false);

        if (!isMasterAdmin && userData?.permissions?.allowedDashboards) {
          const allowedCompanies = Object.keys(userData.permissions.allowedDashboards);
          data = data.filter(company => allowedCompanies.includes(company.id));
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
  }, [isMasterAdmin]);

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
              <CardTitle>Nenhuma empresa disponível</CardTitle>
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
  const { isMasterAdmin, userData, companyId, loading: authLoading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const canViewList =  isMasterAdmin || userData?.permissions?.canViewDashboardList;

  // Redirect no primeiro acesso (login) se tem defaultDashboardId
  useEffect(() => {
    if (authLoading || redirecting) return;

    // Só redireciona uma vez por sessão
    const hasRedirectedThisSession = sessionStorage.getItem('dashboardRedirected');
    
    const doRedirect = async () => {
      // Só redireciona se não pode ver lista de empresas, tem companyId, defaultDashboardId,
      // e se ainda não redirecionou nesta sessão
      if (!canViewList && companyId && userData?.defaultDashboardId && !hasRedirectedThisSession) {
        sessionStorage.setItem('dashboardRedirected', 'true');
        setRedirecting(true);
        router.replace(`/dashboard/${companyId}/${userData.defaultDashboardId}`);
      }
    };

    doRedirect();
  }, [userData, companyId, canViewList, router, redirecting, authLoading]);

  // Se está a redirecionar ou a carregar, mostra spinner
  if (redirecting || authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
      </main>
    );
  }

  if (canViewList) {
    return <MasterAdminCompaniesView />;
  }

  if (userData?.permissions?.allowedDashboards) {
    const allowedCompanies = Object.keys(userData.permissions.allowedDashboards);
    if (allowedCompanies.length === 1) {
      router.replace(`/dashboard/${allowedCompanies[0]}`);
      return null;
    }
    if (allowedCompanies.length > 1) {
      return <MasterAdminCompaniesView />;
    }
  }

  if (companyId) {
    router.push(`/dashboard/${companyId}`);
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Você não está associado a nenhuma empresa.
      </p>
    </main>
  );
}

export default function ProtectedDashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
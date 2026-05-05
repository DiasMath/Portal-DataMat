"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  active?: boolean;
}

function MasterAdminResourcesView() {
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
            active: d.active ?? true,
          };
        }).filter(c => c.active !== false);

        // Filtrar empresas baseadas nas permissões do usuário (allowedResources)
        if (!isMasterAdmin && userData?.permissions?.allowedResources) {
          const allowedCompanies = Object.keys(userData.permissions.allowedResources);
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
                href={`/resources/${company.id}`}
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

function ResourcesPage() {
  const { isMasterAdmin, userData, companyId } = useAuth();
  const router = useRouter();

  // canViewList = pode ver a lista de TODAS as empresas (acesso total)
  const canViewList = isMasterAdmin || userData?.permissions?.canViewResourceList;

  // Se pode ver a lista, mostra a lista de empresas
  if (canViewList) {
    return <MasterAdminResourcesView />;
  }

  // Se tem acesso específico a apenas 1 empresa, vai direto para ela
  if (userData?.permissions?.allowedResources) {
    const allowedCompanies = Object.keys(userData.permissions.allowedResources);
    if (allowedCompanies.length === 1) {
      router.replace(`/resources/${allowedCompanies[0]}`);
      return null;
    }
    // Se tem acesso a múltiplas empresas específicas, mostra a lista filtrada
    if (allowedCompanies.length > 1) {
      return <MasterAdminResourcesView />;
    }
  }

  // Se NÃO tem canViewList mas tem companyId, vai direto para os recursos dessa empresa
  if (companyId) {
    router.replace(`/resources/${companyId}`);
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Você não tem permissão para visualizar esta página.
      </p>
    </main>
  );
}

export default function ProtectedResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesPage />
    </ProtectedRoute>
  );
}
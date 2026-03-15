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
        const data: Company[] = snapshot.docs.map((doc) => {
          const d = doc.data() as Partial<Company>;
          return {
            id: doc.id,
            name: d.name ?? doc.id,
            description: d.description,
            active: d.active ?? true,
          };
        });

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
          <Card>
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
                <Card className="hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-colors">
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
  const { isAdmin, companyId } = useAuth();
  const router = useRouter();

  if (isAdmin) {
    return <MasterAdminCompaniesView />;
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Para usuários não master_admin: redirecionar para o dashboard padrão da empresa
  useEffect(() => {
    async function redirectToCompanyDefaultDashboard() {
      try {
        if (!companyId) {
          setError("Usuário não está associado a nenhuma empresa (companyId).");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

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
            "Nenhum dashboard padrão ativo foi configurado para a sua empresa. Peça para um administrador configurar."
          );
          setLoading(false);
          return;
        }

        const dashboardDoc = snapshot.docs[0];
        const dashboardId = dashboardDoc.id;

        router.replace(`/dashboard/${companyId}/${dashboardId}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro ao localizar dashboard padrão:", errorMessage);
        setError(`Erro ao localizar dashboard padrão: ${errorMessage}`);
        setLoading(false);
      }
    }

    redirectToCompanyDefaultDashboard();
  }, [companyId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg">
        Carregando dashboard padrão...
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

  // Em teoria nunca chega aqui, porque fazemos redirect
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
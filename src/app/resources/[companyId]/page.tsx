"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ArrowLeft } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: string;
  active: boolean;
}

function CompanyResourcesPage() {
  const { isMasterAdmin, userData, companyId } = useAuth();
  const params = useParams<{ companyId: string }>();
  
  // Master admin tem acesso total
  // Se tem canViewResourceList, pode ver todos os recursos permitidos
  // Se não tem canView mas tem companyId, pode ver recursos da empresa dele por padrão
  const canViewList = isMasterAdmin || userData?.permissions?.canViewResourceList;
  
  // Verifica se tem permissão para esta empresa específica
  // Se não tem canViewList mas tem companyId, permite acesso por padrão (a menos que explicitamente negado)
  const userCompanyId = userData?.companyId;
  const isOwnCompany = userCompanyId === params?.companyId;
  const companyAccess = isMasterAdmin 
    ? "all" 
    : userData?.permissions?.allowedResources?.[params?.companyId ?? ""];
  
  const router = useRouter();

  // Se não pode ver a lista E não é da empresa, verifica o acesso específico
  const hasAccess = canViewList || isOwnCompany || companyAccess === "all" || (companyAccess !== undefined && Array.isArray(companyAccess));

  const [company, setCompany] = useState<Company | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
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
          collection(db, "resources"),
          where("companyId", "==", params.companyId),
          where("active", "==", true)
        );
        const resourcesSnap = await getDocs(q);

        let resourcesData: Resource[] = resourcesSnap.docs.map((docSnap) => {
          const d = docSnap.data() as Partial<Resource>;
          return {
            id: docSnap.id,
            name: d.name ?? docSnap.id,
            description: d.description,
            url: d.url ?? "",
            type: d.type ?? "form",
            active: d.active ?? true,
          };
        });

        // Filtrar recursos baseados nas permissões do usuário (similar ao dashboard)
        if (!isMasterAdmin && companyAccess !== "all" && Array.isArray(companyAccess)) {
          resourcesData = resourcesData.filter(r => companyAccess.includes(r.id));
        }

        setResources(resourcesData);
      } catch (err) {
        console.error("Erro ao carregar recursos da empresa:", err);
        setError("Não foi possível carregar os recursos desta empresa.");
      } finally {
        setLoading(false);
      }
    }

    if (canViewList || isOwnCompany) {
      fetchData();
    }
  }, [params?.companyId, canViewList, companyAccess, isMasterAdmin, isOwnCompany]);

  if (!hasAccess) {
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
          <Button variant="outline" onClick={() => router.push("/resources")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
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
            <h1 className="text-2xl font-heading font-semibold">
              Recursos – {company?.name ?? "Empresa"}
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Selecione um recurso para visualizar.
            </p>
          </div>
          {canViewList && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/resources")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </header>

        {resources.length === 0 ? (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-heading">Nenhum recurso cadastrado</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className="hover:shadow-lg hover:border-yellow-text cursor-pointer transition-all"
                onClick={() => window.open(resource.url, "_blank")}
              >
                <CardHeader className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2">
                    {resource.type === "form" ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    )}
                  </span>
                  <CardTitle className="text-base font-heading">{resource.name}</CardTitle>
                </CardHeader>
                {resource.description && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-400 font-body line-clamp-2">
                      {resource.description}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProtectedCompanyResourcesPage() {
  return (
    <ProtectedRoute>
      <CompanyResourcesPage />
    </ProtectedRoute>
  );
}
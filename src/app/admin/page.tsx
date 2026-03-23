"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "@/components/layout/UserNav";
import { Users, Building2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { userData, isAdmin, isMasterAdmin } = useAuth();
  const router = useRouter();
  const hasEditPermission = isMasterAdmin || userData?.permissions?.canEdit;
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
      if (userData?.companyId) {
        getDoc(doc(db, "companies", userData.companyId)).then((snap) => {
          if (snap.exists()) {
            setCompanyName(snap.data().name);
          }
        });
      }
    }, [userData?.companyId]);

  // TRAVA DE SEGURANÇA COM REDIRECIONAMENTO: 
  // Se os dados do usuário já carregaram e ele é apenas "user", manda para o dashboard
  useEffect(() => {
    if (userData && !isAdmin && !isMasterAdmin) {
      router.replace("/dashboard");
    }
  }, [userData, isAdmin, isMasterAdmin, router]);

  // Enquanto avalia e redireciona, não renderiza a página administrativa
  if (userData && !isAdmin && !isMasterAdmin) {
    return null; 
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    Painel Administrativo
                  </CardTitle>
                  <CardDescription>
                    Bem-vindo, {userData?.displayName || userData?.email}
                  </CardDescription>
                </div>
                <UserNav />
              </div>
            </CardHeader>
          </Card>

          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle>Suas Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Email:</p>
                  <p className="text-muted-foreground">{userData?.email}</p>
                </div>
                <div>
                  <p className="font-semibold">Nível de Acesso:</p>
                  <p className="text-muted-foreground">
                    {userData?.role === "master_admin" &&
                      "Master Administrador"}
                    {userData?.role === "admin" && "Administrador"}
                    {userData?.role === "user" && "Usuário"}
                    {hasEditPermission && userData?.role !== "master_admin" && " (Com Permissão de Edição)"}
                  </p>
                </div>
                {userData?.lastLogin && (
                  <div>
                    <p className="font-semibold">Último Acesso:</p>
                    <p className="text-muted-foreground">
                      {new Date(
                        userData.lastLogin.seconds * 1000
                      ).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                {userData?.companyId && (
                  <div>
                    <p className="font-semibold">Empresa:</p>
                    <p className="text-muted-foreground">
                      {companyName || "Carregando..."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ferramentas Administrativas */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Administração</CardTitle>
                <CardDescription>
                  Gerenciamento de usuários, clientes e dashboards do portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="justify-start min-w-[180px]">
                    <Link href="/admin/users" className="inline-flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar Usuários
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start min-w-[200px]">
                    <Link href="/admin/companies" className="inline-flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Gerenciar Empresas
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start min-w-[200px]">
                    <Link href="/admin/dashboards" className="inline-flex items-center">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Gerenciar Dashboards
                    </Link>
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground pt-2">
                  {isMasterAdmin 
                    ? "Você tem acesso completo como Master Administrador." 
                    : "Você tem acesso de Administrador. Suas ações podem ser limitadas de acordo com as suas permissões."}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { user, loading, isAuthorized, isAdmin, isMasterAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => { 
    if (!loading) {
      if (user && isAuthorized) {
        if (isAdmin || isMasterAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else if (user && !isAuthorized) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, isAuthorized, isAdmin, isMasterAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se está logado, não mostra a página home (redirecionará)
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Sistema de Análise</CardTitle>
          <CardDescription>
            Sistema de acesso controlado com autenticação Firebase e dashboards Power BI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Faça login para acessar seus dashboards personalizados e relatórios de análise.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Fazer Login</Link>
            </Button>
          </div>
          <div className="text-sm text-gray-500 text-center">
            Apenas usuários autorizados podem acessar o sistema.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

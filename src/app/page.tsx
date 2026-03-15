'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthorized, isAdmin, isMasterAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => { 
    if (!loading) {
      if (user && isAuthorized) {
        // Logado e com permissão: vai pro painel correspondente
        if (isAdmin || isMasterAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else if (user && !isAuthorized) {
        // Logado mas sem autorização
        router.push('/unauthorized');
      } else {
        // Não está logado: vai direto para a tela de Login
        router.push('/login');
      }
    }
  }, [user, loading, isAuthorized, isAdmin, isMasterAdmin, router]);

  // Enquanto o sistema decide em milissegundos para onde mandar o usuário,
  // mostra apenas um ícone de carregamento centralizado.
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-42px)]">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text"></div>
    </div>
  );
}
'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldOff, LogOut, ArrowLeft, Mail } from "lucide-react";

export default function UnauthorizedPage() {
  const { userData, signOut, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userData && isAuthorized) {
      if (userData.role === 'user') {
        router.push('/dashboard');
      } else if (userData.role === 'admin' || userData.role === 'master_admin') {
        router.push('/admin');
      }
    }
  }, [userData, isAuthorized, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-lg">
        {/* Ícone principal com animação */}
        <div className="relative">
          <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 flex items-center justify-center shadow-lg shadow-yellow-500/10">
            <ShieldOff className="w-20 h-20 text-yellow-text" />
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-lg font-bold">!</span>
          </div>
        </div>

        {/* Código de erro */}
        <div className="text-6xl font-heading font-bold text-yellow-text/30">403</div>
        
        {/* Título e descrição */}
        <div className="space-y-3">
          <h1 className="text-3xl font-heading font-bold text-white">Acesso Restrito</h1>
          <p className="text-gray-400 font-body leading-relaxed">
            Você não tem permissão para acessar esta página. 
            Caso acredite que deveria ter acesso, entre em contato com o administrador.
          </p>
        </div>

        {/* Informações da conta */}
        {userData && (
          <div className="bg-[#1a1a1a] border border-yellow-500/20 p-5 rounded-xl text-left space-y-3">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-text" />
              Sua Conta
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-body">
                <strong className="text-gray-300">Email:</strong> {userData.email}
              </p>
              {userData.displayName && (
                <p className="text-sm text-gray-400 font-body">
                  <strong className="text-gray-300">Nome:</strong> {userData.displayName}
                </p>
              )}
              {userData.role && (
                <p className="text-sm text-gray-400 font-body">
                  <strong className="text-gray-300">Papel:</strong>{' '}
                  <span className="capitalize">
                    {userData.role === 'master_admin' ? 'Master Admin' : 
                     userData.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Próximos passos */}
        <div className="bg-[#1a1a1a] border border-yellow-500/20 p-5 rounded-xl text-left">
          <h3 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-text" />
            Como resolver
          </h3>
          <ul className="text-sm text-gray-400 space-y-2 font-body">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-yellow-text mt-0.5 shrink-0" />
              <span>Entre em contato com o administrador do sistema</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-yellow-text mt-0.5 shrink-0" />
              <span>Solicite a liberação de acesso para esta área</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-yellow-text mt-0.5 shrink-0" />
              <span>Aguarde a confirmação por email</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="font-heading border-gray-700 text-gray-300 hover:border-yellow-text hover:text-yellow-text"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="font-heading border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>

        {/* Footer com branding */}
        <div className="pt-6 text-sm text-gray-500 font-body">
          <span className="text-white font-datamat">DATA</span><span className="text-yellow-text font-datamat">MAT</span> Portal
        </div>
      </div>
    </div>
  );
}
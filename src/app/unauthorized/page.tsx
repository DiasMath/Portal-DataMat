'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldOff, LogOut } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#0d0f12] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Código de erro */}
        <div className="text-8xl font-bold text-yellow-text opacity-50">403</div>
        
        {/* Título e descrição */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">
            Sua conta foi criada, mas ainda não foi autorizada pelo administrador.
          </p>
        </div>

        {/* Ícone */}
        <div className="py-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-[#1a1a1a] border border-yellow-500/20 flex items-center justify-center">
            <ShieldOff className="w-16 h-16 text-yellow-text" />
          </div>
        </div>

        {/* Informações da conta */}
        {userData && (
          <div className="bg-[#1a1a1a] border border-yellow-500/20 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-white mb-2">Sua Conta</h3>
            <p className="text-sm text-gray-400">
              <strong className="text-gray-300">Email:</strong> {userData.email}
            </p>
            {userData.displayName && (
              <p className="text-sm text-gray-400">
                <strong className="text-gray-300">Nome:</strong> {userData.displayName}
              </p>
            )}
          </div>
        )}
        
        {/* Próximos passos */}
        <div className="bg-[#1a1a1a] border border-yellow-500/20 p-4 rounded-lg text-left">
          <h3 className="font-semibold text-white mb-2">Próximos Passos</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Entre em contato com o administrador do sistema</li>
            <li>• Solicite a autorização da sua conta</li>
            <li>• Aguarde a confirmação por email</li>
          </ul>
        </div>

        {/* Botão sair */}
        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:border-yellow-text hover:text-yellow-text mt-4"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>

        {/* Footer com branding */}
        <div className="pt-8 text-sm text-gray-500">
          <span className="text-white">DATA</span><span className="text-yellow-text">MAT</span> Portal
        </div>
      </div>
    </div>
  );
}
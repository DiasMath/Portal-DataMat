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
import { AlertTriangle, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Acesso Não Autorizado</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso, mas ainda não foi autorizada pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Informações da Conta</h3>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {user.email}
              </p>
              {user.displayName && (
                <p className="text-sm text-blue-800">
                  <strong>Nome:</strong> {user.displayName}
                </p>
              )}
            </div>
          )}
          
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Próximos Passos</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Entre em contato com o administrador do sistema</li>
              <li>• Solicite a autorização da sua conta</li>
              <li>• Aguarde a confirmação por email</li>
              <li>• Faça login novamente após a autorização</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Apenas usuários autorizados podem acessar o sistema de dashboards.
              O administrador precisa aprovar sua conta antes do primeiro acesso.
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSignOut}
            variant="outline"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
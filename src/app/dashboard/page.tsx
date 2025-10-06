
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "@/components/ui/user-nav";
import { ExternalLink, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { userData, isAdmin, isMasterAdmin } = useAuth();

  return (
    <ProtectedRoute requireAuth={true}>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Dashboard do Usuário</CardTitle>
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
                  <p className="text-gray-600">{userData?.email}</p>
                </div>
                <div>
                  <p className="font-semibold">Nível de Acesso:</p>
                  <p className="text-gray-600">
                    {userData?.role === 'master_admin' && 'Master Administrador'}
                    {userData?.role === 'admin' && 'Administrador'}
                    {userData?.role === 'user' && 'Usuário'}
                  </p>
                </div>
                {userData?.provider && (
                  <div>
                    <p className="font-semibold">Método de Login:</p>
                    <p className="text-gray-600">
                      {userData.provider === 'google.com' && 'Google'}
                      {userData.provider === 'microsoft.com' && 'Microsoft'}
                      {userData.provider === 'github.com' && 'GitHub'}
                      {userData.provider === 'password' && 'Email/Senha'}
                    </p>
                  </div>
                )}
                {userData?.lastLogin && (
                  <div>
                    <p className="font-semibold">Último Acesso:</p>
                    <p className="text-gray-600">
                      {new Date(userData.lastLogin.seconds * 1000).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard do Power BI */}
          {userData?.dashboardLink && (
            <Card>
              <CardHeader>
                <CardTitle>Seu Dashboard</CardTitle>
                <CardDescription>
                  Acesse seu dashboard personalizado do Power BI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a 
                    href={userData.dashboardLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Dashboard
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Painel Administrativo */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Painel Administrativo</CardTitle>
                <CardDescription>
                  Ferramentas de administração do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline">
                    <Link href="/admin/users" className="inline-flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar Usuários
                    </Link>
                  </Button>
                  {isMasterAdmin && (
                    <div className="text-sm text-gray-500 mt-2">
                      Você tem acesso completo como Master Administrador
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem para usuários sem dashboard */}
          {!userData?.dashboardLink && (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard em Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seu dashboard personalizado ainda não foi configurado. 
                  Entre em contato com o administrador para solicitar acesso aos relatórios.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

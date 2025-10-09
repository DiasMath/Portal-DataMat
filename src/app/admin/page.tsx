"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "@/components/ui/user-nav";
import { ExternalLink, Users, BarChart3, Pencil } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";

export default function AdminPage() {
  const { userData, isMasterAdmin, setUserData } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDashboardLink, setNewDashboardLink] = useState(
    userData?.dashboardLink || ""
  );

  const handleUpdateDashboardLink = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      const token = await currentUser.getIdToken();
      const response = await fetch("/api/users/update-dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newDashboardLink }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao atualizar o link.");
      }

      toast.success("Link do dashboard atualizado com sucesso!");

      // Atualiza o contexto localmente para refletir a mudança instantaneamente
      if (userData) {
        setUserData({ ...userData, dashboardLink: newDashboardLink });
      }

      setIsEditDialogOpen(false);
    } catch (error: Error) {
      console.error("Erro ao atualizar o link do dashboard:", error);
      toast.error(error.message || "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <ProtectedRoute requireMasterAdmin={true}>
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
                  </p>
                </div>
                {userData?.provider && (
                  <div>
                    <p className="font-semibold">Método de Login:</p>
                    <p className="text-muted-foreground">
                      {userData.provider === "google.com" && "Google"}
                      {userData.provider === "microsoft.com" && "Microsoft"}
                      {userData.provider === "github.com" && "GitHub"}
                      {userData.provider === "password" && "Email/Senha"}
                    </p>
                  </div>
                )}
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
                      {userData?.companyId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard do Power BI */}
          <Card>
            <CardHeader>
              <CardTitle>Seu Dashboard</CardTitle>
              <CardDescription>
                Acesse seu dashboard personalizado do Power BI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button
                  asChild
                  className="bg-navbar text-navbar-foreground hover:bg-navbar/65"
                >
                  <Link href="/dashboard" className="inline-flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Abrir Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewDashboardLink(userData?.dashboardLink || "");
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar link do Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ferramentas Administrativas */}
          {isMasterAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Administração</CardTitle>
                <CardDescription>
                  Gerenciamento de usuários e configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline">
                    <Link
                      href="/admin/users"
                      className="inline-flex items-center"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar Usuários
                    </Link>
                  </Button>
                  {isMasterAdmin && (
                    <div className="text-sm text-muted-foreground mt-2">
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
                <p className="text-muted-foreground">
                  Seu dashboard personalizado ainda não foi configurado. Entre
                  em contato com o administrador para solicitar acesso aos
                  relatórios.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Dialog para Editar Link do Dashboard */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Link do Dashboard</DialogTitle>
            <DialogDescription>
              Cole a nova URL do seu dashboard do Power BI aqui. Clique em
              salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dashboard-link" className="text-right">
                URL
              </Label>
              <Input
                id="dashboard-link"
                value={newDashboardLink}
                onChange={(e) => setNewDashboardLink(e.target.value)}
                className="col-span-3"
                placeholder="https://app.powerbi.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleUpdateDashboardLink}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  companyId?: string;
  role: "user" | "admin" | "master_admin";
  authorized: boolean;
  dashboardLink?: string;
  provider?: string;
  createdAt?: { seconds: number };
  lastLogin?: { seconds: number };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    companyId: "",
    role: "user" as "user",
    authorized: true,
    dashboardLink: "",
    password: "", // Campo opcional para senha personalizada
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }
      
      const token = await currentUser.getIdToken();
      
      // Chamar API para criar usuário com Firebase Auth
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          authorized: formData.authorized,
          dashboardLink: formData.dashboardLink || "",
          password: formData.password || undefined, // Enviar senha apenas se fornecida
          companyId: formData.companyId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar usuário");
      }

      // Mostrar mensagem de sucesso
      toast.success(`Usuário criado com sucesso! ${result.message}`);

      if (result.tempPassword) {
        toast.success(`Senha temporária gerada: ${result.tempPassword}`, {
          description: "COMPARTILHE ESTA SENHA COM O USUÁRIO DE FORMA SEGURA!",
        });
      }

      setShowCreateModal(false);
      setFormData({
        email: "",
        displayName: "",
        companyId: "",
        role: "user",
        authorized: true,
        dashboardLink: "",
        password: "",
      });

      await fetchUsers();
    } catch (error: unknown) {
      console.error("Erro ao criar usuário:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao criar usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await fetchUsers();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível e removerá o usuário da autenticação e do banco de dados.")) {
      try {
        const response = await fetch('/api/users/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: userId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao excluir usuário.');
        }

        toast.success('Usuário excluído com sucesso!');
        await fetchUsers(); // Refresh the user list

      } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        toast.error(`Erro ao excluir usuário: ${error.message}`);
      }
    }
  };

  const toggleAuthorization = async (user: User) => {
    await handleUpdateUser(user.id, { authorized: !user.authorized });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireMasterAdmin={true}>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">
                    Gerenciamento de Usuários
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Gerencie usuários, suas permissões e acesso aos dashboards
                  </p>
                </div>
                <Dialog
                  open={showCreateModal}
                  onOpenChange={setShowCreateModal}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-navbar text-navbar-foreground hover:bg-navbar/65">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para adicionar um novo usuário ao
                        sistema
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                          placeholder="usuario@exemplo.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nome de Exibição</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              displayName: e.target.value,
                            })
                          }
                          placeholder="João Silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyId">Nome da Empresa</Label>
                        <Input
                          id="companyId"
                          value={formData.companyId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyId: e.target.value,
                            })
                          }
                          placeholder="DataMat"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Papel *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: "user") =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Deixe vazio para gerar automaticamente"
                        />
                        <p className="text-xs text-muted-foreground">
                          Se deixar vazio, uma senha será gerada automaticamente
                          e um email de redefinição será enviado
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dashboardLink">Link do Dashboard</Label>
                        <Input
                          id="dashboardLink"
                          value={formData.dashboardLink}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dashboardLink: e.target.value,
                            })
                          }
                          placeholder="https://app.powerbi.com/view?..."
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="authorized"
                          checked={formData.authorized}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, authorized: !!checked })
                          }
                        />
                        <Label
                          htmlFor="authorized"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Usuário autorizado
                        </Label>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateModal(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Criando..." : "Criar Usuário"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Users List */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dashboard</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {user.displayName || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {user.companyId || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "master_admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : user.role === "admin"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {user.role === "master_admin" && "Master Admin"}
                          {user.role === "admin" && "Admin"}
                          {user.role === "user" && "Usuário"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.authorized ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              Autorizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <X className="w-3 h-3 mr-1" />
                              Não Autorizado
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.dashboardLink ? (
                          <a
                            href={user.dashboardLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Configurado
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            Não configurado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin
                          ? new Date(
                              user.lastLogin.seconds * 1000
                            ).toLocaleDateString("pt-BR")
                          : "Nunca"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAuthorization(user)}
                          >
                            {user.authorized ? "Desautorizar" : "Autorizar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log("Edit user:", user.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}

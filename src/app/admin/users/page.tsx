"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Plus, Edit, Trash2, Check, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserPermissions {
  canViewDashboardList: boolean;
  canEdit: boolean;
  allowedDashboards: Record<string, "all" | string[]>;
}

interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  companyId?: string;
  role: "user" | "admin" | "master_admin";
  authorized: boolean;
  provider?: string;
  createdAt?: { seconds: number };
  lastLogin?: { seconds: number };
  permissions?: UserPermissions;
  defaultDashboardId?: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface Dashboard {
  id: string;
  name: string;
  companyId: string;
}

export default function UsersManagementPage() {
  const { isMasterAdmin, isAdmin, userData } = useAuth(); 
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  // State for the edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"delete" | "passwordReset" | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const defaultPerms = {
    canViewDashboardList: true,
    canEdit: false,
    allowedDashboards: {} as Record<string, "all" | string[]>,
  };

  const [editFormData, setEditFormData] = useState({
    displayName: "",
    companyId: "",
    role: "user" as User["role"],
    authorized: true,
    defaultDashboardId: "",
    permissions: defaultPerms,
  });

  // Form state for new user
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    companyId: "",
    role: "user",
    authorized: true,
    defaultDashboardId: "",
    permissions: defaultPerms,
  });

  // TRAVA DE SEGURANÇA COM REDIRECIONAMENTO: 
  // Se os dados do usuário já carregaram e ele é apenas "user", manda para o dashboard
  useEffect(() => {
    if (userData && !isAdmin && !isMasterAdmin) {
      router.replace("/dashboard");
    }
  }, [userData, isAdmin, isMasterAdmin, router]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserUid(user.uid);
      } else {
        setCurrentUserUid(null);
      }
    });

    fetchUsers();
    fetchCompanies();
    fetchDashboards();

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map((doc) => ({
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

  const fetchCompanies = async () => {
    try {
      const companiesQuery = query(
        collection(db, "companies"),
        orderBy("name", "asc")
      );
      const snapshot = await getDocs(companiesQuery);
      const data: Company[] = snapshot.docs.map((doc) => {
        const d = doc.data() as Partial<Company>;
        return {
          id: doc.id,
          name: d.name ?? doc.id,
        };
      });
      setCompanies(data);
    } catch (error) {
      console.error("Erro ao buscar empresas para seleção:", error);
    }
  };

  const fetchDashboards = async () => {
    try {
      const snap = await getDocs(collection(db, "dashboards"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        companyId: doc.data().companyId,
      })) as Dashboard[];
      setDashboards(data);
    } catch (error) {
      console.error("Erro ao buscar dashboards", error);
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
          companyId: formData.companyId || undefined,
          permissions: formData.permissions,
          defaultDashboardId: formData.permissions.canViewDashboardList ? null : (formData.defaultDashboardId || null),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar usuário");
      }

      // Mostrar mensagem de sucesso
      toast.success(`Usuário criado com sucesso! ${result.message}`);

      // já dispara email de redefinição de senha para o novo usuário
      try {
        await sendPasswordResetEmail(auth, formData.email);
        toast.success(`Email de redefinição enviado para ${formData.email}`);
      } catch (error) {
        console.error(
          "Erro ao enviar email de redefinição após criação de usuário:",
          error
        );
        toast.error(
          "Usuário criado, mas houve falha ao enviar o email de redefinição."
        );
      }

      setShowCreateModal(false);
      setFormData({
        email: "",
        displayName: "",
        companyId: "",
        role: "user",
        authorized: true,
        defaultDashboardId: "",
        permissions: defaultPerms,
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

  const handleUpdateUser = async (
    userId: string,
    updates: Partial<User>
  ): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "users", userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return false;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao excluir usuário.");
      }

      toast.success("Usuário excluído com sucesso!");
      await fetchUsers(); // Refresh the user list
    } catch (error: unknown) {
      console.error("Erro ao excluir usuário:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Falha ao excluir usuário do banco de dados.";
      toast.error(errorMessage);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Email de redefinição enviado para ${email}`);
    } catch (error) {
      console.error("Erro ao enviar email de redefinição:", error);
      toast.error("Falha ao enviar email.");
    }
  };

  const toggleAuthorization = async (user: User) => {
    await handleUpdateUser(user.id, { authorized: !user.authorized });
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      displayName: user.displayName ?? "",
      companyId: user.companyId ?? "",
      role: user.role,
      authorized: user.authorized,
      defaultDashboardId: user.defaultDashboardId ?? "",
      permissions: user.permissions || {
        ...defaultPerms,
        allowedDashboards: user.companyId ? { [user.companyId]: "all" } : {}
      },
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const success = await handleUpdateUser(editingUser.id, {
      displayName: editFormData.displayName,
      companyId: editFormData.companyId || undefined,
      role: editFormData.role,
      authorized: editFormData.authorized,
      defaultDashboardId: editFormData.permissions.canViewDashboardList ? null : (editFormData.defaultDashboardId || null),
      permissions: {
        ...editFormData.permissions,
        canEdit: editFormData.role === "admin" ? editFormData.permissions.canEdit : false
      },
    });
    if (success) {
      toast.success("Usuário atualizado com sucesso!");
      setShowEditModal(false);
      setEditingUser(null);
    } else {
      toast.error("Falha ao atualizar usuário.");
    }
  };

  const openConfirm = (user: User, mode: "delete" | "passwordReset") => {
    setTargetUser(user);
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetUser || !confirmMode) return;
    if (confirmMode === "delete") {
      await handleDeleteUser(targetUser.id);
    } else if (confirmMode === "passwordReset") {
      await handleSendPasswordReset(targetUser.email);
    }
    setConfirmOpen(false);
    setConfirmMode(null);
    setTargetUser(null);
  };

  // --- INÍCIO: Funções Auxiliares para o Bloco de Permissões ---
  const handlePermChange = (isEditing: boolean, field: keyof UserPermissions, value: any) => {
    if (isEditing) {
      setEditFormData((prev) => ({ ...prev, permissions: { ...prev.permissions, [field]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, permissions: { ...prev.permissions, [field]: value } }));
    }
  };

  const handleAllowedDashboardsType = (isEditing: boolean, companyId: string, type: "none" | "all" | "specific") => {
    const updateLogic = (prev: any) => {
      const newAllowed = { ...prev.permissions.allowedDashboards };
      if (type === "none") delete newAllowed[companyId];
      else if (type === "all") newAllowed[companyId] = "all";
      else newAllowed[companyId] = [];
      return { ...prev, permissions: { ...prev.permissions, allowedDashboards: newAllowed } };
    };

    if (isEditing) setEditFormData(updateLogic);
    else setFormData(updateLogic);
  };

  const handleToggleSpecificDash = (isEditing: boolean, companyId: string, dashId: string) => {
    const updateLogic = (prev: any) => {
      const newAllowed = { ...prev.permissions.allowedDashboards };
      const current = newAllowed[companyId];
      if (Array.isArray(current)) {
        newAllowed[companyId] = current.includes(dashId) ? current.filter((id: string) => id !== dashId) : [...current, dashId];
      }
      return { ...prev, permissions: { ...prev.permissions, allowedDashboards: newAllowed } };
    };

    if (isEditing) setEditFormData(updateLogic);
    else setFormData(updateLogic);
  };

  const renderPermissionsBlock = (isEditing: boolean) => {
    const state = isEditing ? editFormData : formData;
    if (state.role === "master_admin") return null;

    return (
      <div className="space-y-4 p-4 border rounded-md bg-muted/20">
        <h4 className="font-semibold border-b pb-2">Regras e Permissões de Acesso</h4>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`canViewList-${isEditing}`} 
              checked={state.permissions.canViewDashboardList}
              onCheckedChange={(c) => handlePermChange(isEditing, "canViewDashboardList", !!c)}
            />
            <Label htmlFor={`canViewList-${isEditing}`}>Pode acessar a listagem de dashboards das empresas</Label>
          </div>
          {/* O checkbox de permissões avançadas só aparece se for Admin */}
          {state.role === "admin" && (
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id={`canEdit-${isEditing}`} 
                checked={state.permissions.canEdit}
                onCheckedChange={(c) => handlePermChange(isEditing, "canEdit", !!c)}
              />
              <Label htmlFor={`canEdit-${isEditing}`}>Pode Criar, Editar e Excluir Dashboards</Label>
            </div>
          )}
        </div>

        {/* Só mostra este bloco se o canViewDashboardList for true */}
        {state.permissions.canViewDashboardList && (
        <div className="pt-4 border-t">
          <Label className="mb-3 block font-semibold">Quais dashboards este usuário pode ver?</Label>
          <div className="max-h-60 overflow-y-auto space-y-3 border p-3 rounded-md bg-background">
            {companies.map(company => {
              const companyDashboards = dashboards.filter(d => d.companyId === company.id);
              if (companyDashboards.length === 0) return null;

              const access = state.permissions.allowedDashboards[company.id];
              const hasAccess = access !== undefined;
              const isAll = access === "all";
              const specificList = Array.isArray(access) ? access : [];

              return (
                <div key={company.id} className="border p-3 rounded-md space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`comp-${company.id}-${isEditing}`}
                      checked={hasAccess} 
                      onCheckedChange={(c) => handleAllowedDashboardsType(isEditing, company.id, c ? "all" : "none")} 
                    />
                    <Label htmlFor={`comp-${company.id}-${isEditing}`} className="font-semibold">{company.name}</Label>
                  </div>
                  
                  {hasAccess && (
                    <div className="pl-6 space-y-3">
                      <Select value={isAll ? "all" : "specific"} onValueChange={(v) => handleAllowedDashboardsType(isEditing, company.id, v as any)}>
                        <SelectTrigger className="h-8 text-xs w-[220px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Acessa Todos os Dashboards</SelectItem>
                          <SelectItem value="specific">Apenas Dashboards Específicos</SelectItem>
                        </SelectContent>
                      </Select>

                      {!isAll && (
                        <div className="space-y-2 mt-2 pl-3 border-l-2 border-primary/40">
                          {companyDashboards.map(dash => (
                            <div key={dash.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`dash-${dash.id}-${isEditing}`}
                                checked={specificList.includes(dash.id)}
                                onCheckedChange={() => handleToggleSpecificDash(isEditing, company.id, dash.id)}
                              />
                              <Label htmlFor={`dash-${dash.id}-${isEditing}`} className="text-xs font-normal">{dash.name}</Label>
                            </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  };
  // --- FIM: Funções Auxiliares ---

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
      </div>
    );
  }

  // Enquanto avalia e redireciona, não renderiza a página administrativa
  if (userData && !isAdmin && !isMasterAdmin) {
    return null; 
  }

  return (
    <ProtectedRoute>
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
                {isMasterAdmin && (
                <Dialog
                  open={showCreateModal}
                  onOpenChange={setShowCreateModal}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-create-buttons text-yellow-text hover:bg-navbar/55">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        <Label htmlFor="companyId">Empresa (companyId)</Label>
                        <Input
                          id="companyId"
                          list="companies-list"
                          value={formData.companyId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyId: e.target.value,
                            })
                          }
                          placeholder="ID da empresa (companies)"
                        />
                        <datalist id="companies-list">
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Papel *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: "user" | "admin") =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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

                      {/* --- BLOCO DO DASHBOARD PADRÃO ADICIONADO AQUI --- */}
                      {formData.role !== "master_admin" && !formData.permissions.canViewDashboardList && (
                        <div className="space-y-2 pt-2">
                          <Label>Dashboard Padrão (Opcional)</Label>
                          <Select
                            value={formData.defaultDashboardId}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                defaultDashboardId: value === "none" ? "" : value,
                              })
                            }
                            disabled={!formData.companyId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um dashboard inicial" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Nenhum (usar padrão da empresa)
                              </SelectItem>
                              {dashboards
                                .filter((d) => d.companyId === formData.companyId)
                                .map((dash) => (
                                  <SelectItem key={dash.id} value={dash.id}>
                                    {dash.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            O usuário será redirecionado para este painel ao logar.
                          </p>
                        </div>
                      )}
                      {/* ------------------------------------------------ */}

                      {renderPermissionsBlock(false)}
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
                )}
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
                    <TableHead>Último Acesso</TableHead>
                    {isMasterAdmin && <TableHead>Ações</TableHead>}
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
                            {(() => {
                              const company = companies.find(
                                (c) => c.id === user.companyId
                              );
                              return company?.name || user.companyId || "N/A";
                            })()}
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
                        {user.lastLogin
                          ? new Date(
                              user.lastLogin.seconds * 1000
                            ).toLocaleDateString("pt-BR")
                          : "Nunca"}
                      </TableCell>
                      
                      {/* Botões */}
                      {isMasterAdmin && (
                        <TableCell>
                          <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirm(user, "delete")}
                            disabled={user.id === currentUserUid}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      )}
                      {/* Fim */}

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Nome de Exibição</Label>
                <Input
                  id="edit-displayName"
                  value={editFormData.displayName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-companyId">Empresa (CompanyId)</Label>
                <Input
                  id="edit-companyId"
                  list="companies-list-edit"
                  value={editFormData.companyId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      companyId: e.target.value,
                    })
                  }
                  placeholder="ID da empresa (companies)"
                />
                <datalist id="companies-list-edit">
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </datalist>
              </div>
              {/* Oculta o Dashboard Padrão se for master_admin, pois ele tem acesso global */}
              {editingUser?.role !== "master_admin" && !editFormData.permissions.canViewDashboardList && (
                <div className="space-y-2">
                  <Label htmlFor="edit-defaultDashboardId">Dashboard Padrão (Opcional)</Label>
                  <Select
                    value={editFormData.defaultDashboardId}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, defaultDashboardId: value === "none" ? "" : value })
                    }
                    disabled={!editFormData.companyId}
                  >
                    <SelectTrigger id="edit-defaultDashboardId">
                      <SelectValue placeholder="Selecione um dashboard padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Usar padrão da empresa</SelectItem>
                      {dashboards
                        .filter((d) => d.companyId === editFormData.companyId)
                        .map((dash) => (
                          <SelectItem key={dash.id} value={dash.id}>
                            {dash.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingUser?.role === "master_admin" ? (
                <div className="space-y-1">
                  <Label htmlFor="edit-role">Papel</Label>
                  <p className="text-sm font-medium">
                    Master Admin{" "}
                    <span className="text-xs text-muted-foreground">
                      (não editável pela interface)
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Papel</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value: "user" | "admin") =>
                      setEditFormData({ ...editFormData, role: value })
                    }
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-authorized"
                  checked={editFormData.authorized}
                  onCheckedChange={(checked) =>
                    setEditFormData({
                      ...editFormData,
                      authorized: !!checked,
                    })
                  }
                />
                <Label
                  htmlFor="edit-authorized"
                  className="cursor-pointer text-sm font-medium"
                >
                  Usuário autorizado
                </Label>
              </div>
              {renderPermissionsBlock(true)}
              <div className="space-y-2 pt-2 border-t">
                <Label className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> Ações de Email
                </Label>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    editingUser && openConfirm(editingUser, "passwordReset")
                  }
                >
                  Enviar Link para Redefinir Senha
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Fechar
              </Button>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para exclusão e envio de email */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {confirmMode === "delete"
                ? "Confirmar exclusão"
                : "Confirmar envio de email"}
            </DialogTitle>
            <DialogDescription>
              {confirmMode === "delete"
                ? `Tem certeza que deseja excluir o usuário "${
                    targetUser?.email ?? ""
                  }"? Esta ação é irreversível e removerá o usuário da autenticação e do banco de dados.`
                : `Tem certeza que deseja enviar um link de redefinição de senha para ${
                    targetUser?.email ?? ""
                  }?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={confirmMode === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

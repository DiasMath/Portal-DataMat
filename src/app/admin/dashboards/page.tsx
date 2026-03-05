"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Company {
  id: string;
  name: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  pbiReportId: string;
  active: boolean;
  isDefault: boolean;
}

export default function DashboardsManagementPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"toggleActive" | "delete" | null>(null);
  const [targetDashboard, setTargetDashboard] = useState<Dashboard | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    companyId: "",
    pbiReportId: "",
    description: "",
    active: true,
    isDefault: false,
  });

  useEffect(() => {
    fetchCompaniesAndDashboards();
  }, []);

  const fetchCompaniesAndDashboards = async () => {
    setLoading(true);
    try {
      // Carregar empresas para o select
      const companiesQuery = query(
        collection(db, "companies"),
        orderBy("name", "asc")
      );
      const companiesSnap = await getDocs(companiesQuery);
      const companiesData: Company[] = companiesSnap.docs.map((doc) => {
        const d = doc.data() as Partial<Company>;
        return {
          id: doc.id,
          name: d.name ?? doc.id,
        };
      });
      setCompanies(companiesData);

      // Carregar dashboards
      const dashboardsQuery = query(
        collection(db, "dashboards"),
        orderBy("name", "asc")
      );
      const dashboardsSnap = await getDocs(dashboardsQuery);
      const dashboardsData: Dashboard[] = dashboardsSnap.docs.map((doc) => {
        const d = doc.data() as Partial<Dashboard>;
        return {
          id: doc.id,
          name: d.name ?? doc.id,
          description: d.description,
          companyId: d.companyId ?? "",
          pbiReportId: d.pbiReportId ?? "",
          active: d.active ?? true,
          isDefault: d.isDefault ?? false,
        };
      });
      setDashboards(dashboardsData);
    } catch (error) {
      console.error("Erro ao buscar dashboards/empresas:", error);
      toast.error("Erro ao buscar dashboards.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.companyId || !formData.pbiReportId) {
      toast.error("Nome, Empresa e pbiReportId são obrigatórios.");
      return;
    }

    try {
      // garantir que a empresa exista
      const companyExists = companies.some(
        (c) => c.id === formData.companyId
      );
      if (!companyExists) {
        toast.error("Empresa selecionada não existe.");
        return;
      }

      // evitar múltiplos defaults para mesma empresa (simplesmente marca os outros como não-default depois, se necessário)
      if (formData.isDefault) {
        // TODO: aqui poderíamos atualizar outros dashboards da mesma empresa para isDefault = false
        // TODO: por enquanto, apenas permitimos múltiplos defaults se o admin quiser
      }

      await addDoc(collection(db, "dashboards"), {
        name: formData.name,
        companyId: formData.companyId,
        pbiReportId: formData.pbiReportId,
        description: formData.description || null,
        active: formData.active,
        isDefault: formData.isDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Dashboard criado com sucesso.");
      setShowCreateModal(false);
      setFormData({
        name: "",
        companyId: "",
        pbiReportId: "",
        description: "",
        active: true,
        isDefault: false,
      });
      await fetchCompaniesAndDashboards();
    } catch (error) {
      console.error("Erro ao criar dashboard:", error);
      toast.error("Erro ao criar dashboard.");
    }
  };

  const [editFormData, setEditFormData] = useState({
    name: "",
    companyId: "",
    pbiReportId: "",
    description: "",
    active: true,
    isDefault: false,
  });

  const handleOpenEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setEditFormData({
      name: dashboard.name,
      companyId: dashboard.companyId,
      pbiReportId: dashboard.pbiReportId,
      description: dashboard.description ?? "",
      active: dashboard.active,
      isDefault: dashboard.isDefault,
    });
    setShowEditModal(true);
  };

  const handleUpdateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDashboard) return;

    try {
      await updateDoc(doc(db, "dashboards", editingDashboard.id), {
        name: editFormData.name,
        companyId: editFormData.companyId,
        pbiReportId: editFormData.pbiReportId,
        description: editFormData.description || null,
        active: editFormData.active,
        isDefault: editFormData.isDefault,
        updatedAt: serverTimestamp(),
      });
      toast.success("Dashboard atualizado com sucesso.");
      setShowEditModal(false);
      setEditingDashboard(null);
      await fetchCompaniesAndDashboards();
    } catch (error) {
      console.error("Erro ao atualizar dashboard:", error);
      toast.error("Erro ao atualizar dashboard.");
    }
  };

  const handleToggleActive = async (dashboard: Dashboard) => {
    try {
      await updateDoc(doc(db, "dashboards", dashboard.id), {
        active: !dashboard.active,
        updatedAt: serverTimestamp(),
      });
      await fetchCompaniesAndDashboards();
    } catch (error) {
      console.error("Erro ao atualizar status do dashboard:", error);
      toast.error("Erro ao atualizar status do dashboard.");
    }
  };

  const handleDeleteDashboard = async (dashboard: Dashboard) => {
    try {
      await deleteDoc(doc(db, "dashboards", dashboard.id));
      toast.success("Dashboard excluído com sucesso.");
      await fetchCompaniesAndDashboards();
    } catch (error) {
      console.error("Erro ao excluir dashboard:", error);
      toast.error("Erro ao excluir dashboard.");
    }
  };

  const openConfirm = (dashboard: Dashboard, mode: "toggleActive" | "delete") => {
    setTargetDashboard(dashboard);
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetDashboard || !confirmMode) return;
    if (confirmMode === "toggleActive") {
      await handleToggleActive(targetDashboard);
    } else if (confirmMode === "delete") {
      await handleDeleteDashboard(targetDashboard);
    }
    setConfirmOpen(false);
    setConfirmMode(null);
    setTargetDashboard(null);
  };

  if (loading && dashboards.length === 0) {
    return (
      <ProtectedRoute requireMasterAdmin>
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireMasterAdmin>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">Gerenciamento de Dashboards</CardTitle>
                  <CardDescription>
                    Cadastre e gerencie dashboards associados aos workspaces das empresas.
                  </CardDescription>
                </div>
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-create-buttons text-yellow-text hover:bg-navbar/55">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Dashboard
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Dashboard</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para adicionar um novo dashboard ao portal.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDashboard} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Dashboard *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="Vendas Mensais"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyId">Empresa (companyId) *</Label>
                        <Input
                          id="companyId"
                          list="companies-list"
                          value={formData.companyId}
                          onChange={(e) =>
                            setFormData({ ...formData, companyId: e.target.value })
                          }
                          placeholder="ID da empresa (companies)"
                          required
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
                        <Label htmlFor="pbiReportId">ReportId *</Label>
                        <Input
                          id="pbiReportId"
                          value={formData.pbiReportId}
                          onChange={(e) =>
                            setFormData({ ...formData, pbiReportId: e.target.value })
                          }
                          required
                          placeholder="GUID do report no Power BI"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Descrição opcional do dashboard"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="active"
                          checked={formData.active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, active: !!checked })
                          }
                        />
                        <Label
                          htmlFor="active"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Dashboard ativo
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isDefault"
                          checked={formData.isDefault}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isDefault: !!checked })
                          }
                        />
                        <Label
                          htmlFor="isDefault"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Dashboard padrão da empresa
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
                        <Button type="submit">Criar Dashboard</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboards Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dashboards.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Nenhum dashboard cadastrado até o momento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dashboard</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CompanyId</TableHead>
                      <TableHead>ReportId</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[160px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboards.map((dashboard) => {
                      const company = companies.find(
                        (c) => c.id === dashboard.companyId
                      );
                      return (
                        <TableRow key={dashboard.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{dashboard.name}</p>
                              {dashboard.description && (
                                <p className="text-xs text-muted-foreground">
                                  {dashboard.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {company ? company.name : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono">
                              {dashboard.companyId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono">
                              {dashboard.pbiReportId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span>{dashboard.active ? "Ativo" : "Inativo"}</span>
                              {dashboard.isDefault && (
                                <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary w-fit">
                                  Padrão
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => handleOpenEdit(dashboard)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                type="button"
                                onClick={() => openConfirm(dashboard, "delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de edição de dashboard */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Dashboard</DialogTitle>
            <DialogDescription>
              Atualize as informações do dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDashboard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Dashboard *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-companyId">Empresa (companyId) *</Label>
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
                required
              />
              <datalist id="companies-list-edit">
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pbiReportId">ReportId *</Label>
              <Input
                id="edit-pbiReportId"
                value={editFormData.pbiReportId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    pbiReportId: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={editFormData.active}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, active: !!checked })
                }
              />
              <Label
                htmlFor="edit-active"
                className="cursor-pointer text-sm font-medium"
              >
                Dashboard ativo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isDefault"
                checked={editFormData.isDefault}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, isDefault: !!checked })
                }
              />
              <Label
                htmlFor="edit-isDefault"
                className="cursor-pointer text-sm font-medium"
              >
                Dashboard padrão da empresa
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para ativar/desativar/excluir */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {confirmMode === "delete"
                ? "Confirmar exclusão"
                : "Confirmar alteração de status"}
            </DialogTitle>
            <DialogDescription>
              {confirmMode === "delete"
                ? `Tem certeza que deseja excluir o dashboard "${
                    targetDashboard?.name ?? ""
                  }"? Esta ação é irreversível.`
                : `Tem certeza que deseja ${
                    targetDashboard?.active ? "desativar" : "ativar"
                  } o dashboard "${targetDashboard?.name ?? ""}"?`}
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


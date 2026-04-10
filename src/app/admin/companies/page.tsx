"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
import { useAuth } from "@/contexts/AuthContext";

interface Company {
  id: string;
  name: string;
  pbiGroupId: string;
  description?: string;
  active: boolean;
}

export default function CompaniesManagementPage() {
  const { isMasterAdmin, isAdmin, userData } = useAuth(); 
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"toggleActive" | "delete" | null>(null);
  const [targetCompany, setTargetCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    pbiGroupId: "",
    description: "",
    active: true,
  });

  // TRAVA DE SEGURANÇA COM REDIRECIONAMENTO: 
  // Se os dados do usuário já carregaram e ele é apenas "user", manda para o dashboard
  useEffect(() => {
    if (userData && !isAdmin && !isMasterAdmin) {
      router.replace("/dashboard");
    }
  }, [userData, isAdmin, isMasterAdmin, router]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const companiesQuery = query(
        collection(db, "companies"),
        orderBy("name", "asc")
      );
      const snapshot = await getDocs(companiesQuery);
      const data = snapshot.docs.map((doc) => {
        const d = doc.data() as Partial<Company>;
        return {
          id: doc.id,
          name: d.name ?? doc.id,
          pbiGroupId: d.pbiGroupId ?? "",
          description: d.description,
          active: d.active ?? true,
        } as Company;
      });
      setCompanies(data);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Erro ao buscar empresas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pbiGroupId) {
      toast.error("Nome e pbiGroupId são obrigatórios.");
      return;
    }

    try {
      await addDoc(collection(db, "companies"), {
        name: formData.name,
        pbiGroupId: formData.pbiGroupId,
        description: formData.description || null,
        active: formData.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Empresa criada com sucesso.");
      setShowCreateModal(false);
      setFormData({
        name: "",
        pbiGroupId: "",
        description: "",
        active: true,
      });
      await fetchCompanies();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast.error("Erro ao criar empresa.");
    }
  };

  const [editFormData, setEditFormData] = useState({
    name: "",
    pbiGroupId: "",
    description: "",
    active: true,
  });

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setEditFormData({
      name: company.name,
      pbiGroupId: company.pbiGroupId,
      description: company.description ?? "",
      active: company.active,
    });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    try {
      await updateDoc(doc(db, "companies", editingCompany.id), {
        name: editFormData.name,
        pbiGroupId: editFormData.pbiGroupId,
        description: editFormData.description || null,
        active: editFormData.active,
        updatedAt: serverTimestamp(),
      });
      toast.success("Empresa atualizada com sucesso.");
      setShowEditModal(false);
      setEditingCompany(null);
      await fetchCompanies();
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toast.error("Erro ao atualizar empresa.");
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      await updateDoc(doc(db, "companies", company.id), {
        active: !company.active,
        updatedAt: serverTimestamp(),
      });
      await fetchCompanies();
    } catch (error) {
      console.error("Erro ao atualizar status da empresa:", error);
      toast.error("Erro ao atualizar status da empresa.");
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    try {
      await deleteDoc(doc(db, "companies", company.id));
      toast.success("Empresa excluída com sucesso.");
      await fetchCompanies();
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      toast.error("Erro ao excluir empresa.");
    }
  };

  const openConfirm = (company: Company, mode: "toggleActive" | "delete") => {
    setTargetCompany(company);
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetCompany || !confirmMode) return;
    if (confirmMode === "toggleActive") {
      await handleToggleActive(targetCompany);
    } else if (confirmMode === "delete") {
      await handleDeleteCompany(targetCompany);
    }
    setConfirmOpen(false);
    setConfirmMode(null);
    setTargetCompany(null);
  };

  if (loading && companies.length === 0) {
    return (
      <ProtectedRoute>
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
        </main>
      </ProtectedRoute>
    );
  }

  // Enquanto avalia e redireciona, não renderiza a página administrativa
  if (userData && !isAdmin && !isMasterAdmin) {
    return null; 
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-white">Gerenciamento de Empresas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Cadastre e gerencie os clientes (empresas) que possuem workspaces no Power BI.
                  </CardDescription>
                </div>

                {/* Modal - Criação Empresa */}
                {isMasterAdmin && (
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-text text-black hover:bg-yellow-text/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#1a1a1a] border border-yellow-500/20">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Empresa</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para adicionar uma nova empresa (cliente) ao portal.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="Loja Juntos"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pbiGroupId">GroupId *</Label>
                        <Input
                          id="pbiGroupId"
                          value={formData.pbiGroupId}
                          onChange={(e) =>
                            setFormData({ ...formData, pbiGroupId: e.target.value })
                          }
                          required
                          placeholder="GUID do workspace no Power BI"
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
                          placeholder="Descrição opcional da empresa"
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
                          Empresa ativa
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
                        <Button type="submit">Criar Empresa</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
                {/* Fim */}

              </div>
            </CardHeader>
          </Card>

          <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-white">Empresas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {companies.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">
                  Nenhuma empresa cadastrada até o momento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300 text-left">Empresa</TableHead>
                      <TableHead className="text-gray-300 text-center">ID</TableHead>
                      <TableHead className="text-gray-300 text-center">GroupId</TableHead>
                      <TableHead className="text-gray-300 text-center">Status</TableHead>
                      {isMasterAdmin && <TableHead className="text-gray-300 text-center w-[160px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium text-left">
                          {company.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-mono">{company.id}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-mono">
                            {company.pbiGroupId}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs text-muted-foreground">
                            {company.active ? "Ativa" : "Inativa"}
                          </span>
                        </TableCell>

                        {/* Botões */}
                        {/* Só o Master Admin vê os botões de Editar/Excluir */}
                        {isMasterAdmin && (
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleOpenEdit(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              type="button"
                              onClick={() => openConfirm(company, "delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        )}
                        {/* Fim */}
                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de edição de empresa */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border border-yellow-500/20">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Empresa *</Label>
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
              <Label htmlFor="edit-pbiGroupId">
                GroupId *
              </Label>
              <Input
                id="edit-pbiGroupId"
                value={editFormData.pbiGroupId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    pbiGroupId: e.target.value,
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
                Empresa ativa
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
        <DialogContent className="sm:max-w-[420px] bg-[#1a1a1a] border border-yellow-500/20">
          <DialogHeader>
            <DialogTitle>
              {confirmMode === "delete"
                ? "Confirmar exclusão"
                : "Confirmar alteração de status"}
            </DialogTitle>
            <DialogDescription>
              {confirmMode === "delete"
                ? `Tem certeza que deseja excluir a empresa "${
                    targetCompany?.name ?? ""
                  }"? Esta ação é irreversível.`
                : `Tem certeza que deseja ${
                    targetCompany?.active ? "desativar" : "ativar"
                  } a empresa "${targetCompany?.name ?? ""}"?`}
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


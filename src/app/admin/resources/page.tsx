"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
import { Plus, Edit, Trash2, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
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
}

interface Resource {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  url: string;
  type: string;
  active: boolean;
}

export default function ResourcesManagementPage() {
  const { isMasterAdmin, isAdmin, userData, companyId } = useAuth(); 
  const router = useRouter();
  const canWriteResources = isMasterAdmin || userData?.permissions?.canEdit;
  const canReadResources = canWriteResources || companyId; // Pode ver se tem companyId ou é admin
  const [resources, setResources] = useState<Resource[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  // Filter state
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    companyId: "",
    url: "",
    description: "",
    type: "",
    active: true,
  });

  useEffect(() => {
    if (userData && !isAdmin && !isMasterAdmin) {
      router.replace("/dashboard");
    }
  }, [userData, isAdmin, isMasterAdmin, router]);

  useEffect(() => {
    fetchCompaniesAndResources();
  }, []);

  const fetchCompaniesAndResources = async () => {
    setLoading(true);
    try {
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

      const resourcesQuery = query(
        collection(db, "resources"),
        orderBy("name", "asc")
      );
      const resourcesSnap = await getDocs(resourcesQuery);
      let resourcesData: Resource[] = resourcesSnap.docs.map((doc) => {
        const d = doc.data() as Partial<Resource>;
        return {
          id: doc.id,
          name: d.name ?? doc.id,
          description: d.description,
          companyId: d.companyId ?? "",
          url: d.url ?? "",
          type: d.type ?? "",
          active: d.active ?? true,
        };
      });

      // Filtrar resources: master_admin vê tudo, outros só veem da sua empresa
      if (!isMasterAdmin) {
        const userCompanyId = userData?.companyId;
        if (userCompanyId) {
          resourcesData = resourcesData.filter(r => r.companyId === userCompanyId);
        } else {
          resourcesData = []; // Sem companyId, não vê nada
        }
      }
      setResources(resourcesData);

      const uniqueTypes = [...new Set(resourcesData.map(r => r.type).filter(Boolean))];
      const defaultTypes = ["form", "spreadsheet"];
      const allTypes = [...new Set([...defaultTypes, ...uniqueTypes])];
      setResourceTypes(allTypes);
    } catch (error) {
      console.error("Erro ao buscar recursos/empresas:", error);
      toast.error("Erro ao buscar recursos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.companyId || !formData.url) {
      toast.error("Nome, Empresa e URL são obrigatórios.");
      return;
    }

    try {
      const companyExists = companies.some(
        (c) => c.id === formData.companyId
      );
      if (!companyExists) {
        toast.error("Empresa selecionada não existe.");
        return;
      }

      await addDoc(collection(db, "resources"), {
        name: formData.name,
        companyId: formData.companyId,
        url: formData.url,
        description: formData.description || null,
        type: formData.type,
        active: formData.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Recurso criado com sucesso.");
      setShowCreateModal(false);
      setFormData({
        name: "",
        companyId: "",
        url: "",
        description: "",
        type: "",
        active: true,
      });
      await fetchCompaniesAndResources();
    } catch (error) {
      console.error("Erro ao criar recurso:", error);
      toast.error("Erro ao criar recurso.");
    }
  };

  const [editFormData, setEditFormData] = useState({
    name: "",
    companyId: "",
    url: "",
    description: "",
    type: "",
    active: true,
  });

  const handleOpenEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditFormData({
      name: resource.name,
      companyId: resource.companyId,
      url: resource.url,
      description: resource.description ?? "",
      type: resource.type ?? "",
      active: resource.active,
    });
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    try {
      await updateDoc(doc(db, "resources", editingResource.id), {
        name: editFormData.name,
        companyId: editFormData.companyId,
        url: editFormData.url,
        description: editFormData.description || null,
        type: editFormData.type,
        active: editFormData.active,
        updatedAt: serverTimestamp(),
      });
      toast.success("Recurso atualizado com sucesso.");
      setShowEditModal(false);
      setEditingResource(null);
      await fetchCompaniesAndResources();
    } catch (error) {
      console.error("Erro ao atualizar recurso:", error);
      toast.error("Erro ao atualizar recurso.");
    }
  };

  const handleToggleActive = async (resource: Resource) => {
    try {
      await updateDoc(doc(db, "resources", resource.id), {
        active: !resource.active,
        updatedAt: serverTimestamp(),
      });
      await fetchCompaniesAndResources();
    } catch (error) {
      console.error("Erro ao atualizar status do recurso:", error);
      toast.error("Erro ao atualizar status do recurso.");
    }
  };

  const handleDeleteResource = async (resource: Resource) => {
    setDeletingResource(resource);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingResource) return;
    try {
      await deleteDoc(doc(db, "resources", deletingResource.id));
      toast.success("Recurso excluído com sucesso.");
      setShowDeleteModal(false);
      setDeletingResource(null);
      await fetchCompaniesAndResources();
    } catch (error) {
      console.error("Erro ao excluir recurso:", error);
      toast.error("Erro ao excluir recurso.");
    }
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name ?? companyId;
  };

  const filteredResources = useMemo(() => {
    const base = isMasterAdmin || isAdmin
      ? resources
      : resources.filter((r) => r.companyId === userData?.companyId);

    return base.filter((resource) => {
      if (companyFilter !== "all" && resource.companyId !== companyFilter) return false;
      if (statusFilter === "active" && !resource.active) return false;
      if (statusFilter === "inactive" && resource.active) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = resource.name?.toLowerCase().includes(q);
        const matchDesc = resource.description?.toLowerCase().includes(q);
        const matchType = resource.type?.toLowerCase().includes(q);
        const company = companies.find((c) => c.id === resource.companyId);
        const matchCompany = company?.name?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchType && !matchCompany) return false;
      }
      return true;
    });
  }, [resources, companyFilter, statusFilter, searchQuery, companies, isMasterAdmin, isAdmin, userData]);

  if (loading && resources.length === 0) {
    return (
      <ProtectedRoute>
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
        </main>
      </ProtectedRoute>
    );
  }

  if (userData && !isAdmin && !isMasterAdmin) {
    return null; 
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 pt-16 pb-8 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="bg-[#1a1a1a] border border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-white font-heading">Gerenciamento de Recursos</CardTitle>
                  <CardDescription className="text-gray-400 font-body">
                    Cadastre e gerencie formulários Google e planilhas das empresas.
                  </CardDescription>
                </div>

                {canWriteResources && (
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-text text-black hover:bg-yellow-text/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Recurso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleCreateResource} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Criar Novo Recurso</DialogTitle>
                        <DialogDescription className="font-body">
                          Adicione um novo formulário ou planilha.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="Nome do recurso"
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
                        <Label htmlFor="type">Tipo *</Label>
                        <Input
                          id="type"
                          list="types-list"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          required
                          placeholder="Digite ou selecione um tipo"
                        />
                        <datalist id="types-list">
                          {resourceTypes.map((type) => (
                            <option key={type} value={type} />
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="url">URL *</Label>
                        <Input
                          id="url"
                          value={formData.url}
                          onChange={(e) =>
                            setFormData({ ...formData, url: e.target.value })
                          }
                          required
                          placeholder="https://docs.google.com/..."
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
                          placeholder="Descrição opcional do recurso"
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
                          Recurso ativo
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
                        <Button type="submit">Criar Recurso</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-[#1a1a1a] border border-gray-800">
            <CardHeader>
              <CardTitle className="text-white font-heading">Recursos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Buscar por nome, tipo ou empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {(companyFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setCompanyFilter("all"); setStatusFilter("all"); setSearchQuery(""); }}
                    className="text-gray-400 hover:text-white"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
            <CardContent className="p-0">
              {filteredResources.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 font-body">
                  Nenhum recurso cadastrado até o momento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300 text-left">Recurso</TableHead>
                      <TableHead className="text-gray-300 text-center">Tipo</TableHead>
                      <TableHead className="text-gray-300 text-center">Empresa</TableHead>
                      <TableHead className="text-gray-300 text-center">Status</TableHead>
                      {canWriteResources && <TableHead className="text-gray-300 text-center w-[160px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-yellow-400" />
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-yellow-text transition-colors flex items-center gap-2"
                            >
                              {resource.name}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {resource.description && (
                            <p className="text-xs text-gray-500 mt-1 font-body">
                              {resource.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-body rounded-full bg-gray-100 text-gray-800">
                            {resource.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-gray-300 font-body">
                          {getCompanyName(resource.companyId)}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleActive(resource)}
                            className={`inline-flex px-2 py-1 text-xs font-body font-semibold rounded-full cursor-pointer transition-colors ${
                              resource.active
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {resource.active ? "Ativo" : "Inativo"}
                          </button>
                        </TableCell>
                        {canWriteResources && (
                          <TableCell className="text-center">
                            <div className="flex space-x-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(resource)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteResource(resource)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        {editingResource && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleUpdateResource} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="font-heading">Editar Recurso</DialogTitle>
                  <DialogDescription className="font-body">
                    Atualize as informações do recurso.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome *</Label>
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
                      setEditFormData({ ...editFormData, companyId: e.target.value })
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
                  <Label htmlFor="edit-type">Tipo *</Label>
                  <Input
                    id="edit-type"
                    list="types-list-edit"
                    value={editFormData.type}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, type: e.target.value })
                    }
                    required
                  />
                  <datalist id="types-list-edit">
                    {resourceTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-url">URL *</Label>
                  <Input
                    id="edit-url"
                    value={editFormData.url}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, url: e.target.value })
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
                      setEditFormData({ ...editFormData, description: e.target.value })
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
                    Recurso ativo
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
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <ConfirmationDialog
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title="Excluir Recurso"
          description="Esta ação não pode ser desfeita."
          itemName={deletingResource?.name || ""}
          confirmLabel="Excluir"
          onConfirm={confirmDelete}
        />
        </div>
      </main>
    </ProtectedRoute>
  );
}
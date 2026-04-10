"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "@/components/layout/UserNav";
import { Users, Building2, LayoutDashboard, UserPlus, Building, Layout, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc, getDocs, collection, getCountFromServer, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalDashboards: number;
  activeDashboards: number;
}

interface AuditLog {
  id: string;
  action: string;
  actorUid: string;
  actorName?: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  createdAt: { seconds: number } | { _seconds: number } | any;
}

const actionLabels: Record<string, string> = {
  USER_CREATE: "criou usuário",
  USER_DELETE: "excluiu usuário",
  USER_ROLE_UPDATE: "alterou role de",
  USER_AUTHZ_UPDATE: "alterou autorização de",
  COMPANY_CREATE: "criou empresa",
  COMPANY_UPDATE: "atualizou empresa",
  COMPANY_DELETE: "excluiu empresa",
  DASHBOARD_CREATE: "criou dashboard",
  DASHBOARD_UPDATE: "atualizou dashboard",
  DASHBOARD_DELETE: "excluiu dashboard",
};

function formatRelativeTime(timestamp: { seconds: number } | { _seconds: number } | any): string {
  let seconds: number;
  
  if (timestamp && typeof timestamp === 'object') {
    if ('seconds' in timestamp) {
      seconds = timestamp.seconds;
    } else if ('_seconds' in timestamp) {
      seconds = timestamp._seconds;
    } else {
      return "data不明";
    }
  } else {
    return "data不明";
  }
  
  const date = new Date(seconds * 1000);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' - ');
}

export default function AdminPage() {
  const { userData, isAdmin, isMasterAdmin } = useAuth();
  const router = useRouter();
  const hasEditPermission = isMasterAdmin || userData?.permissions?.canEdit;
  const [companyName, setCompanyName] = useState<string>("");
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCompanies: 0, totalDashboards: 0, activeDashboards: 0 });
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (userData?.companyId) {
      getDoc(doc(db, "companies", userData.companyId)).then((snap) => {
        if (snap.exists()) {
          setCompanyName(snap.data().name);
        }
      });
    }
  }, [userData?.companyId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, companiesSnap, dashboardsSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "companies")),
          getCountFromServer(collection(db, "dashboards")),
        ]);
        
        const dashboardsQuery = query(collection(db, "dashboards"));
        const allDashboards = (await getDocs(dashboardsQuery)).docs;
        const activeCount = allDashboards.filter(d => d.data().active === true).length;

        setStats({
          totalUsers: usersSnap.data().count,
          totalCompanies: companiesSnap.data().count,
          totalDashboards: dashboardsSnap.data().count,
          activeDashboards: activeCount,
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch("/api/admin/activity");
        const data = await response.json();
        
        if (data.logs) {
          setRecentActivity(data.logs);
        }
      } catch (error) {
        console.error("Erro ao buscar atividade recente:", error);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, []);

  useEffect(() => {
    if (userData && !isAdmin && !isMasterAdmin) {
      router.replace("/dashboard");
    }
  }, [userData, isAdmin, isMasterAdmin, router]);

  if (userData && !isAdmin && !isMasterAdmin) {
    return null; 
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-2xl text-white">
                    Painel Administrativo
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Bem-vindo, {userData?.displayName || userData?.email}
                  </CardDescription>
                </div>
                <UserNav />
              </div>
            </CardHeader>
          </Card>

          {/* Suas Informações + Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suas Informações */}
            <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-yellow-text">ℹ️</span> Suas Informações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="font-semibold text-white">Email:</p>
                    <p className="text-gray-400">{userData?.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Nível de Acesso:</p>
                    <p className="text-gray-400">
                      {userData?.role === "master_admin" && "Master Administrador"}
                      {userData?.role === "admin" && "Administrador"}
                      {userData?.role === "user" && "Usuário"}
                      {hasEditPermission && userData?.role !== "master_admin" && " (Com Permissão de Edição)"}
                    </p>
                  </div>
                  {userData?.lastLogin && (
                    <div>
                      <p className="font-semibold text-white">Último Acesso:</p>
                      <p className="text-gray-400">
                        {new Date(userData.lastLogin.seconds * 1000).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {userData?.companyId && (
                    <div>
                      <p className="font-semibold text-white">Empresa:</p>
                      <p className="text-gray-400">{companyName || "Carregando..."}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-yellow-text">📊</span> Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-text"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-yellow-text" />
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                      <p className="text-sm text-gray-400">Usuários</p>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                      <Building2 className="w-6 h-6 mx-auto mb-2 text-yellow-text" />
                      <p className="text-2xl font-bold text-white">{stats.totalCompanies}</p>
                      <p className="text-sm text-gray-400">Empresas</p>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                      <LayoutDashboard className="w-6 h-6 mx-auto mb-2 text-yellow-text" />
                      <p className="text-2xl font-bold text-white">{stats.totalDashboards}</p>
                      <p className="text-sm text-gray-400">Dashboards</p>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                      <div className="flex justify-center gap-3 mb-1">
                        <span className="text-green-500 text-xl">✓</span>
                        <span className="text-red-500 text-xl">✗</span>
                      </div>
                      <p className="text-xl font-bold text-white">{stats.activeDashboards} / {stats.totalDashboards}</p>
                      <p className="text-sm text-gray-400">Dashboards Ativos</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ferramentas Administrativas */}
          {isAdmin && (
            <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-yellow-text">⚙️</span> Ferramentas de Administração
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gerenciamento de usuários, clientes e dashboards do portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="justify-start min-w-[180px] border-gray-700 text-gray-300 hover:border-yellow-text hover:text-yellow-text hover:bg-yellow-text/10 transition-colors">
                    <Link href="/admin/users" className="inline-flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar Usuários
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start min-w-[200px] border-gray-700 text-gray-300 hover:border-yellow-text hover:text-yellow-text hover:bg-yellow-text/10 transition-colors">
                    <Link href="/admin/companies" className="inline-flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Gerenciar Empresas
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start min-w-[200px] border-gray-700 text-gray-300 hover:border-yellow-text hover:text-yellow-text hover:bg-yellow-text/10 transition-colors">
                    <Link href="/admin/dashboards" className="inline-flex items-center">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Gerenciar Dashboards
                    </Link>
                  </Button>
                </div>
                <div className="text-sm text-gray-500 pt-2">
                  {isMasterAdmin 
                    ? "Você tem acesso completo como Master Administrador." 
                    : "Você tem acesso de Administrador. Suas ações podem ser limitadas de acordo com as suas permissões."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Atividade Recente */}
          <Card className="bg-[#1a1a1a] border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-yellow-text">📋</span> Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-text"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhuma atividade registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-text/20 flex items-center justify-center">
                        {log.action.includes("USER") && <UserPlus className="w-4 h-4 text-yellow-text" />}
                        {log.action.includes("COMPANY") && <Building className="w-4 h-4 text-yellow-text" />}
                        {log.action.includes("DASHBOARD") && <Layout className="w-4 h-4 text-yellow-text" />}
                        {log.action.includes("DELETE") && <Trash2 className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="text-yellow-text font-medium">{log.actorName || 'Usuário'}</span>
                          {' '}{actionLabels[log.action] || log.action}
                          {log.targetName && <span className="text-gray-300"> → {log.targetName}</span>}
                        </p>
                        {(log.details?.email as string) && (
                          <p className="text-gray-500 text-xs">{log.details?.email as string}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-gray-500 text-xs">{formatRelativeTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
import { NextResponse, type NextRequest } from "next/server";
import * as msal from "@azure/msal-node";
import { adminDb } from "@/lib/firebase-admin";
import { validateAuthorized } from "@/lib/auth-helpers";

const isDev = process.env.NODE_ENV !== "production";

// Configuração MSAL / Power BI (mesma base da rota padrão)
const TENANT_ID = process.env.PBI_TENANT_ID;
const CLIENT_ID = process.env.PBI_CLIENT_ID;
const CLIENT_SECRET = process.env.PBI_CLIENT_SECRET;

const AUTHORITY_URL = `${process.env.PBI_AUTHORITY_URL}${TENANT_ID}`;
const SCOPE = [process.env.PBI_SCOPE || ""];
const API_BASE_URL = process.env.PBI_API_BASE_URL;

const msalConfig = {
  auth: {
    clientId: CLIENT_ID || "",
    authority: AUTHORITY_URL,
    clientSecret: CLIENT_SECRET,
  },
};
const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const clientCredentialRequest = {
    scopes: SCOPE,
  };

  try {
    const response = await cca.acquireTokenByClientCredential(
      clientCredentialRequest
    );
    if (!response || !response.accessToken) {
      throw new Error("Falha ao adquirir token do Azure AD.");
    }
    return response.accessToken;
  } catch (error) {
    console.error("Erro em getAccessToken:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; dashboardId: string }> }
) {
  // Em rotas dinâmicas do App Router, params é uma Promise em APIs.
  const { companyId, dashboardId } = await params;

  // Garante usuário autenticado/authorized
  const user = await validateAuthorized(request);
  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado ou não autorizado." },
      { status: 401 }
    );
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin não configurado." },
      { status: 500 }
    );
  }

  try {
    // =========================================================================
    // 1) A TRAVA DE SEGURANÇA (PREVENÇÃO DE IDOR)
    // =========================================================================
    
    // Vamos buscar os dados reais deste utilizador à base de dados
    const userDoc = await adminDb.collection("users").doc(user.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "Utilizador não encontrado na base de dados." },
        { status: 403 }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role || "user";
    const userCompanyId = userData?.companyId;
    const userPermissions = userData?.permissions;

    // Master admin e admin têm acesso total
    if (userRole !== "master_admin" && userRole !== "admin") {
      const canViewList = userPermissions?.canViewDashboardList === true;
      const companyAccess = userPermissions?.allowedDashboards?.[companyId];
      const hasGranularAccess = companyAccess === "all" || (Array.isArray(companyAccess) && companyAccess.includes(dashboardId));
      const isOwnCompany = userCompanyId === companyId;

      // Regra 1: Precisa de canViewList, acesso granular, ou ser empresa própria
      if (!canViewList && !hasGranularAccess && !isOwnCompany) {
        console.warn(`[ALERTA DE SEGURANÇA] UID: ${user.uid} tentou aceder ao dashboard da empresa: ${companyId}`);
        return NextResponse.json(
          { error: "Acesso negado. Não tem permissão para visualizar relatórios desta empresa." },
          { status: 403 }
        );
      }

      // Regra 2: Se é empresa própria mas NÃO tem canViewList nem acesso granular,
      // verificar se tem dashboard restrito (defaultDashboardId)
      if (isOwnCompany && !canViewList && !hasGranularAccess) {
        const userDefaultDashboard = userData?.defaultDashboardId;
        if (userDefaultDashboard && userDefaultDashboard !== dashboardId) {
          console.warn(`[SEGURANÇA] UID: ${user.uid} tentou aceder ao dashboard ${dashboardId} mas só tem acesso ao ${userDefaultDashboard}`);
          return NextResponse.json(
            { error: "Acesso negado. Você só pode visualizar o dashboard padrão atribuído." },
            { status: 403 }
          );
        }
      }
    }
    // =========================================================================

    // 2) Buscar empresa para obter o groupId (workspaceId do Power BI)
    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json(
        { error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const companyData = companySnap.data() as {
      pbiGroupId?: string;
    };
    const groupId = companyData.pbiGroupId;

    if (!groupId) {
      return NextResponse.json(
        { error: "Empresa não possui groupId (workspaceId) configurado." },
        { status: 400 }
      );
    }

    // 3) Buscar dashboard para obter reportId
    const dashboardRef = adminDb.collection("dashboards").doc(dashboardId);
    const dashboardSnap = await dashboardRef.get();

    if (!dashboardSnap.exists) {
      return NextResponse.json(
        { error: "Dashboard não encontrado." },
        { status: 404 }
      );
    }

    const dashboardData = dashboardSnap.data() as {
      reportId?: string;
      pbiReportId?: string;
      companyId?: string;
    };
    const reportId = dashboardData.reportId ?? dashboardData.pbiReportId;

    // Verificação extra de consistência: O dashboard pertence mesmo a esta empresa?
    if (dashboardData.companyId && dashboardData.companyId !== companyId) {
       return NextResponse.json(
        { error: "Este dashboard não pertence à empresa solicitada." },
        { status: 400 }
      );
    }

    if (!reportId) {
      return NextResponse.json(
        { error: "Dashboard não possui reportId/pbiReportId configurado." },
        { status: 400 }
      );
    }

    // 4) Obter accessToken do Azure AD
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falha na autenticação do Service Principal (Etapa A)" },
        { status: 500 }
      );
    }

    // 5) Obter detalhes do relatório
    const detailsUrl = `${API_BASE_URL}groups/${groupId}/reports/${reportId}`;
    const detailsResponse = await fetch(detailsUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!detailsResponse.ok) {
      const errorBody = await detailsResponse.text();
      if (isDev) {
        console.error(
          "Erro da API Power BI (getReportDetails by dashboard):",
          errorBody
        );
      }
      throw new Error(
        `Falha ao obter detalhes do relatório: ${detailsResponse.statusText}`
      );
    }

    const detailsJson = await detailsResponse.json();
    const embedUrl = detailsJson.embedUrl;
    const embedReportId = detailsJson.id;

    // 6) Gerar embed token
    const tokenUrl = `${API_BASE_URL}groups/${groupId}/reports/${reportId}/GenerateToken`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      // Restringe o acesso ao Embed Token apenas para Leitura (View)
      body: JSON.stringify({ accessLevel: "View" }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      if (isDev) {
        console.error(
          "ERRO CRÍTICO NA ETAPA B-2 (getEmbedToken by dashboard):",
          errorBody
        );
      }
      throw new Error("Falha ao gerar embed token");
    }

    const tokenJson = await tokenResponse.json();
    const embedToken = tokenJson.token;

    return NextResponse.json({
      accessToken: embedToken,
      embedUrl,
      embedReportId,
    });
  } catch (error) {
    console.error("Erro geral no handler da API por dashboard:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// Arquivo: src/app/api/powerbi/get-embed-info/route.ts
import { NextResponse } from 'next/server';
import * as msal from '@azure/msal-node';

// --- 1. CONFIGURAÇÃO SEGURA (Lendo do .env.local) ---
const TENANT_ID = process.env.PBI_TENANT_ID;
const CLIENT_ID = process.env.PBI_CLIENT_ID;
const CLIENT_SECRET = process.env.PBI_CLIENT_SECRET;
const GROUP_ID = process.env.PBI_GROUP_ID; // <--- VAMOS USAR ISSO AGORA
const REPORT_ID = process.env.PBI_REPORT_ID;

const AUTHORITY_URL = `${process.env.PBI_AUTHORITY_URL}${TENANT_ID}`;
const SCOPE = [process.env.PBI_SCOPE || ''];
const API_BASE_URL = process.env.PBI_API_BASE_URL;

const msalConfig = {
  auth: {
    clientId: CLIENT_ID || '',
    authority: AUTHORITY_URL,
    clientSecret: CLIENT_SECRET,
  },
};
const cca = new msal.ConfidentialClientApplication(msalConfig);

// --- 2. FUNÇÕES AUXILIARES ---

async function getAccessToken() {
  const clientCredentialRequest = {
    scopes: SCOPE,
  };
  
  try {
    const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
    if (!response || !response.accessToken) {
      throw new Error('Falha ao adquirir token do Azure AD.');
    }
    return response.accessToken;
  } catch (error) {
    console.error("Erro em getAccessToken:", error);
    return null;
  }
}

async function getReportDetails(accessToken: string) {
  const url = `${API_BASE_URL}groups/${GROUP_ID}/reports/${REPORT_ID}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro da API Power BI (getReportDetails):", errorBody);
      throw new Error(`Falha ao obter detalhes do relatório (Etapa B-1): ${response.statusText} | ${errorBody}`);
    }
    
    const data = await response.json();
    return { embedUrl: data.embedUrl, id: data.id };
  } catch (error) {
    console.error("Erro em getReportDetails:", error);
    return null;
  }
}

/**
 * Etapa B-2: Gerar o Embed Token para o Relatório
 */
async function getEmbedToken(accessToken: string) {
  //
  // --- A CORREÇÃO ESTÁ AQUI ---
  //
  // O URL deve corresponder ao do Python, incluindo o GROUP_ID,
  // pois o relatório está em um Workspace (Grupo).
  const url = `${API_BASE_URL}groups/${GROUP_ID}/reports/${REPORT_ID}/GenerateToken`;
  //
  // --- FIM DA CORREÇÃO ---
  //
  
  const requestBody = { accessLevel: 'View' };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text(); 
      console.error("====================================================");
      console.error("ERRO CRÍTICO NA ETAPA B-2 (getEmbedToken):");
      console.error(errorBody); 
      console.error("====================================================");
      throw new Error(`Falha ao gerar embed token: ${errorBody}`);
    }

    const data = await response.json();
    return { token: data.token };
  } catch (error) {
    console.error("Erro em getEmbedToken:", error);
    throw error; 
  }
}

// --- 3. O HANDLER DA API ---

export async function GET() {
  console.log("Recebida requisição para /api/powerbi/get-embed-info");
  
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Falha na autenticação do Service Principal (Etapa A)" }, { status: 500 });
    }

    const reportDetails = await getReportDetails(accessToken);
    if (!reportDetails) {
      return NextResponse.json({ error: "Falha ao obter detalhes do relatório (Etapa B-1). Verifique permissões do SP no Workspace." }, { status: 500 });
    }

    // A Etapa B-2 agora deve funcionar
    const embedData = await getEmbedToken(accessToken); 

    return NextResponse.json({
      accessToken: embedData.token,
      embedUrl: reportDetails.embedUrl,
      embedReportId: reportDetails.id,
    });

  } catch (error) {
    console.error("Erro geral no handler da API:", error);
    const errorMessage = (error instanceof Error) ? error.message : "Erro interno desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
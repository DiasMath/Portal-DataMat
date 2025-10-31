// Arquivo: src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { IEmbedConfiguration, models } from 'powerbi-client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

// Importa o "recheio" da navbar que criamos
import { HeaderContent } from '@/components/ui/header-content';

interface EmbedInfo {
  accessToken: string;
  embedUrl: string;
  embedReportId: string;
}

function DashboardPage() {
  const [embedConfig, setEmbedConfig] = useState<IEmbedConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efeito para buscar os dados de incorporação
  useEffect(() => {
    async function fetchEmbedInfo() {
      try {
        setLoading(true);
        setError(null);
        
        // Chama a API route segura que criamos
        const response = await fetch('/api/powerbi/get-embed-info');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Falha ao buscar dados: ${response.statusText}`);
        }
        
        const data: EmbedInfo = await response.json();

        // Monta o objeto de configuração do Power BI
        const config: IEmbedConfiguration = {
          type: 'report',
          tokenType: models.TokenType.Embed,
          accessToken: data.accessToken,
          embedUrl: data.embedUrl,
          id: data.embedReportId,
          settings: {
            panes: { 
              pageNavigation: { visible: false }, 
              filters: { visible: true } 
            },
            bars: { 
              actionBar: { visible: false }, 
              statusBar: { visible: false } 
            },
          },
        };
        setEmbedConfig(config);
      } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : "Erro desconhecido";
        console.error("Erro ao incorporar relatório:", errorMessage);
        setError(`Erro ao carregar relatório: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchEmbedInfo();
  }, []); // Array vazio garante que rode apenas uma vez

  // --- Renderização ---

  // Estado de Carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg">
        Carregando Relatório...
      </div>
    );
  }

  // Estado de Erro
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen font-sans text-lg text-red-600">
        {error}
      </div>
    );
  }

  // Estado de Sucesso (Relatório Pronto)
  return (
    embedConfig && (
      // Container de tela cheia com posicionamento relativo
      <div className="h-screen w-screen overflow-hidden relative">
        
        {/* O "remendo" marrom que funciona como header */}
        <div className="absolute top-0 left-0 w-full h-[42px] bg-[#753838] z-50">

          {/* Renderiza o conteúdo (Home + UserNav) */}
          <HeaderContent />

        </div>
        
        {/* O relatório do Power BI */}
        <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={new Map([
            ['loaded', () => console.log('Relatório carregado.')],
            ['error', (event: any) => console.error('Erro do Power BI:', event?.detail)],
          ])}
          cssClassName="h-full w-full"
        />
      </div>
    )
  );
}

// Exportação padrão com o Wrapper de Rota Protegida
export default function ProtectedDashboardPage() {
  return (
    <ProtectedRoute> 
      <DashboardPage />
    </ProtectedRoute>
  );
}
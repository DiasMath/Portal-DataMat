"use client"

export default function ReportPage() {
  return (
    <div className="iframe-container">
      <iframe
        title="LOJAJUNTOS_PBI"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/view?r=eyJrIjoiY2NiODU5NDQtMzc5NS00Nzc1LTgwM2QtNmVlZjgxY2M4MjJiIiwidCI6IjI5YTkxMTk4LTVlN2MtNGNkOC04NmEwLTIwMmEyMTBmOGMwNyJ9"
        allowFullScreen
      />
      <div className="iframe-mask"></div>
    </div>
  );
}

// Parâmetros úteis:

// &chromeless=1 - Remove alguns elementos da interface
// &navContentPaneEnabled=false - Remove o painel de navegação
// &filterPaneEnabled=false - Remove o painel de filtros
// src="https://app.powerbi.com/view?r=eyJrIjoiY2NiODU5NDQtMzc5NS00Nzc1LTgwM2QtNmVlZjgxY2M4MjJiIiwidCI6IjI5YTkxMTk4LTVlN2MtNGNkOC04NmEwLTIwMmEyMTBmOGMwNyJ9"
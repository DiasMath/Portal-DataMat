import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';

/**
 * Fecha uma aba de painel (criar tabela/view/procedure/function) com a
 * mesma proteção que o botão "X" da barra de abas já tem: nunca deixa o
 * Workbench sem nenhuma aba aberta. Os painéis chamam `REMOVE_TAB`
 * diretamente ao cancelar ou criar com sucesso — sem essa checagem, fechar
 * a última aba restante (por exemplo, se todas as outras já tinham sido
 * fechadas) deixaria o Workbench com zero abas.
 */
export function useCloseCreatorTab() {
  const { state, dispatch, newTab } = useSqlWorkbench();

  return (tabId: string) => {
    if (state.tabs.length <= 1) {
      newTab();
    }
    dispatch({ type: 'REMOVE_TAB', payload: tabId });
  };
}

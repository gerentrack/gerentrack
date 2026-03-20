import { useResponsivo } from "./useResponsivo";

/**
 * Recebe o objeto `styles` original de um componente e retorna
 * uma versão com overrides responsivos aplicados para mobile.
 * Apenas chaves existentes no objeto original são afetadas.
 */
function aplicarMobile(styles) {
  const s = { ...styles };

  // Page containers
  if (s.page) s.page = { ...s.page, padding: "20px 12px 60px" };
  if (s.formPage) s.formPage = { ...s.formPage, margin: "24px auto", padding: "0 12px 60px" };

  // Typography
  if (s.pageTitle) s.pageTitle = { ...s.pageTitle, fontSize: 26, marginBottom: 16 };
  if (s.sectionTitle) s.sectionTitle = { ...s.sectionTitle, fontSize: 20, marginBottom: 14 };
  if (s.formTitle) s.formTitle = { ...s.formTitle, fontSize: 24 };
  if (s.heroTitle) s.heroTitle = { ...s.heroTitle, fontSize: 32 };

  // Grids → single column on mobile
  if (s.adminGrid) s.adminGrid = { ...s.adminGrid, gridTemplateColumns: "1fr", gap: 16 };
  if (s.grid2) s.grid2 = { ...s.grid2, gridTemplateColumns: "1fr", gap: 16 };
  if (s.grid2form) s.grid2form = { ...s.grid2form, gridTemplateColumns: "1fr" };
  if (s.statusControlsGrid) s.statusControlsGrid = { ...s.statusControlsGrid, gridTemplateColumns: "1fr" };
  if (s.eventosGrid) s.eventosGrid = { ...s.eventosGrid, gridTemplateColumns: "1fr", gap: 14 };
  if (s.eventoAcoesGrid) s.eventoAcoesGrid = { ...s.eventoAcoesGrid, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 };

  // Cards & containers
  if (s.formCard) s.formCard = { ...s.formCard, padding: 18, borderRadius: 12 };
  if (s.adminCard) s.adminCard = { ...s.adminCard, padding: 16 };
  if (s.eventoCard) s.eventoCard = { ...s.eventoCard, padding: 16 };
  if (s.statCard) s.statCard = { ...s.statCard, padding: "12px 14px", minWidth: 70 };
  if (s.infoCard) s.infoCard = { ...s.infoCard, padding: 16 };
  if (s.statusControlsCard) s.statusControlsCard = { ...s.statusControlsCard, padding: "14px 14px" };

  // Stats
  if (s.statValue) s.statValue = { ...s.statValue, fontSize: 28 };
  if (s.statsRow) s.statsRow = { ...s.statsRow, gap: 10 };

  // Tables
  if (s.th) s.th = { ...s.th, padding: "8px 10px", fontSize: 10 };
  if (s.td) s.td = { ...s.td, padding: "8px 10px", fontSize: 13 };

  // Filters & buttons area
  if (s.filtros) s.filtros = { ...s.filtros, gap: 10 };
  if (s.painelHeader) s.painelHeader = { ...s.painelHeader, flexDirection: "column", gap: 12 };
  if (s.painelBtns) s.painelBtns = { ...s.painelBtns, flexWrap: "wrap", gap: 8 };

  // Hero
  if (s.heroSection) s.heroSection = { ...s.heroSection, padding: "32px 12px 24px", marginBottom: 28 };
  if (s.heroBtns) s.heroBtns = { ...s.heroBtns, flexDirection: "column", alignItems: "stretch" };

  // Sumulas
  if (s.sumuHeader) s.sumuHeader = { ...s.sumuHeader, padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 8 };
  if (s.sumuProva) s.sumuProva = { ...s.sumuProva, fontSize: 18 };

  // Digitar
  if (s.digitarHeader) s.digitarHeader = { ...s.digitarHeader, padding: "12px 14px" };

  // Status bar
  if (s.statusBar) s.statusBar = { ...s.statusBar, padding: "10px 12px", gap: 12 };

  // Evento ação buttons
  if (s.eventoAcaoBtn) s.eventoAcaoBtn = { ...s.eventoAcaoBtn, padding: "14px 10px", fontSize: 13 };

  // Filter provas bar
  if (s.filtroProvasBar) s.filtroProvasBar = { ...s.filtroProvasBar, padding: "12px 14px", gap: 12 };

  return s;
}

/**
 * Hook que retorna os estilos responsivos.
 * Uso: const s = useStylesResponsivos(styles);
 */
export function useStylesResponsivos(styles) {
  const { mobile } = useResponsivo();
  return mobile ? aplicarMobile(styles) : styles;
}

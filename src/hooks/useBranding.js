import { useEffect } from "react";
import { useLocalStorage } from "../lib/storage/useLocalStorage";
import { GT_DEFAULT_ICON, GT_DEFAULT_LOGO } from "../shared/branding";

const BRANDING_DEFAULT = {
  icon: "",
  logo: "",
  nome: "GERENTRACK",
  slogan: "COMPETIÇÃO COM PRECISÃO",
  heroBg: "",
  heroBadge: "PLATAFORMA DE COMPETIÇÕES",
  heroSubtitulo: "Gerencie competições, inscrições, súmulas e resultados em um só lugar.",
  heroStats: { competicoes: true, organizadores: true, equipes: true, atletas: true },
  heroMostrarTitulo: true,
  heroOrdem: ["badge", "titulo", "stats", "subtitulo"],
  heroTamanhos: { badge: 1, titulo: 1, subtitulo: 1, stats: 1 },
  heroAltura: 400,
  heroPosicoes: {
    badge: { x: 50, y: 8 },
    titulo: { x: 50, y: 28 },
    subtitulo: { x: 50, y: 48 },
    stats: { x: 50, y: 72 },
  },
  assinaturasFederacao: {
    MG: { nome: "Federação Mineira de Atletismo", logo: "" },
  },
};

/**
 * Hook extraído do App.jsx (decomposição 2.3)
 * Gerencia branding do site (logo, nome, slogan, hero, assinaturas de federação).
 */
export function useBranding() {
  const [siteBranding, setSiteBranding] = useLocalStorage("gt_branding", BRANDING_DEFAULT);

  // Migração: garantir assinaturasFederacao com MG padrão
  useEffect(() => {
    if (!siteBranding.assinaturasFederacao) {
      setSiteBranding(prev => ({ ...prev, assinaturasFederacao: { MG: { nome: "Federação Mineira de Atletismo", logo: "" } } }));
    }
  }, []);

  const gtIcon = siteBranding.icon || GT_DEFAULT_ICON;
  const gtLogo = siteBranding.logo || null;
  const gtLogoFull = siteBranding.logo || GT_DEFAULT_LOGO;
  const gtNome = siteBranding.nome || "GERENTRACK";
  const gtSlogan = siteBranding.slogan || "COMPETIÇÃO COM PRECISÃO";

  return { siteBranding, setSiteBranding, gtIcon, gtLogo, gtLogoFull, gtNome, gtSlogan };
}

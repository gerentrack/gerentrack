import { useMemo } from "react";

/**
 * Detecta subdomínio e resolve para o slug do organizador.
 *
 * Ex: fmat.gerentrack.com.br → { subdominio: "fmat", slug: "federacao-mineira-..." }
 *     gerentrack.com.br       → { subdominio: null, slug: null }
 *     localhost:5173           → { subdominio: null, slug: null }
 */
export function useSubdominio(organizadores) {
  return useMemo(() => {
    const hostname = window.location.hostname;

    // Ignorar localhost e IPs
    if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return { subdominio: null, slug: null, org: null };
    }

    // Extrair subdomínio de *.gerentrack.com.br
    const parts = hostname.split(".");
    // gerentrack.com.br = 3 partes, fmat.gerentrack.com.br = 4 partes
    if (parts.length < 4) {
      return { subdominio: null, slug: null, org: null };
    }

    const sub = parts[0].toLowerCase();

    // Ignorar subdomínios reservados
    if (["www", "api", "admin", "app"].includes(sub)) {
      return { subdominio: null, slug: null, org: null };
    }

    // Buscar organizador com subdomínio ativo
    const org = (organizadores || []).find(
      o => o.subdominio === sub && o.subdominioAtivo
    );

    if (!org) {
      return { subdominio: sub, slug: null, org: null };
    }

    return { subdominio: sub, slug: org.slug || org.id, org };
  }, [organizadores]);
}

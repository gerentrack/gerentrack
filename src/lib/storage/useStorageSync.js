/**
 * useStorageSync
 *
 * Hook que escuta o evento nativo `storage` do browser para sincronizar
 * uma chave do localStorage entre abas abertas no mesmo navegador.
 *
 * Uso típico:
 *   useStorageSync("atl_vinculo_sol", setSolicitacoesVinculo);
 *
 * Quando outra aba grava o mesmo key, o setter é chamado com o novo valor,
 * mantendo o estado React sincronizado sem necessidade de polling.
 *
 * Extraído de App.jsx (linha 104) — Etapa 1 da refatoração.
 */
import { useEffect } from "react";

export function useStorageSync(key, setter) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setter(JSON.parse(e.newValue));
        } catch (_err) {
          // JSON inválido — ignorar
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, setter]);
}

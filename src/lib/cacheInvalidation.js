/**
 * Cache invalidation baseada em versão de schema.
 *
 * Quando o schema dos dados muda (campos adicionados/removidos/renomeados),
 * incrementar SCHEMA_VERSION força limpeza automática dos caches locais
 * na próxima visita do usuário — sem precisar limpar cache manualmente.
 *
 * O que é limpo:
 * - IndexedDB (cache_atletas, cache_equipes, etc.)
 * - localStorage seletivo (apenas chaves de dados, não preferências do usuário)
 *
 * O que NÃO é limpo:
 * - Sessão do usuário (atl_usuario) — usuário permanece logado
 * - Preferências visuais (gt_tema_claro)
 * - Firestore (fonte de verdade) — dados são re-sincronizados automaticamente
 *
 * Executar ANTES dos hooks de dados (chamado em App.jsx no mount).
 */

// ─── INCREMENTAR quando o schema de dados mudar ────────────────────────────
const SCHEMA_VERSION = 1;

const SCHEMA_KEY = "gt_schema_version";

// Chaves de localStorage que são PRESERVADAS (preferências, sessão)
const PRESERVED_KEYS = new Set([
  "atl_usuario",           // sessão do usuário logado
  "atl_perfis_disponiveis", // perfis disponíveis
  "gt_tema_claro",         // preferência de tema
  "gt_admin_config",       // config do admin
  "gt_cookie_consent",     // consentimento de cookies
  "gt_schema_version",     // a própria versão
]);

/**
 * Verifica se o schema mudou e limpa caches obsoletos.
 * @returns {boolean} true se houve invalidação
 */
export function verificarSchema() {
  try {
    const versaoAtual = parseInt(localStorage.getItem(SCHEMA_KEY) || "0", 10);

    if (versaoAtual >= SCHEMA_VERSION) return false;

    console.info(`[CacheInvalidation] Schema ${versaoAtual} → ${SCHEMA_VERSION}. Limpando caches...`);

    // 1. Limpar IndexedDB completamente (dados serão re-sincronizados do Firestore)
    try {
      indexedDB.deleteDatabase("gerentrack_cache");
      console.info("[CacheInvalidation] IndexedDB limpo.");
    } catch (err) {
      console.warn("[CacheInvalidation] Erro ao limpar IndexedDB:", err.message);
    }

    // 2. Limpar localStorage seletivamente (preservar sessão e preferências)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !PRESERVED_KEYS.has(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.info(`[CacheInvalidation] ${keysToRemove.length} chaves do localStorage limpas.`);

    // 3. Registrar nova versão
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));

    return true;
  } catch (err) {
    console.error("[CacheInvalidation] Erro:", err);
    return false;
  }
}

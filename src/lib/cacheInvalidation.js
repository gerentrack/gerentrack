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
// Para limpeza manual: incrementar este número
const SCHEMA_VERSION = 1;

// ─── Build ID: muda automaticamente a cada deploy ──────────────────────────
// Limpa IndexedDB (não localStorage) quando o código do app muda
const BUILD_ID = __APP_BUILD_ID__ || "dev";
const BUILD_KEY = "gt_build_id";

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
    const buildAtual = localStorage.getItem(BUILD_KEY) || "";
    const schemaMudou = versaoAtual < SCHEMA_VERSION;
    const buildMudou = BUILD_ID !== "dev" && buildAtual !== BUILD_ID;

    if (!schemaMudou && !buildMudou) return false;

    // Schema mudou: limpeza completa (IndexedDB + localStorage de dados)
    // Build mudou: limpeza leve (só IndexedDB — dados re-sincronizam do Firestore)
    if (schemaMudou) {
      console.info(`[CacheInvalidation] Schema ${versaoAtual} → ${SCHEMA_VERSION}. Limpeza completa.`);
    } else {
      console.info(`[CacheInvalidation] Build ${buildAtual.slice(0, 8)} → ${BUILD_ID.slice(0, 8)}. Limpando IndexedDB.`);
    }

    // 1. Limpar IndexedDB (sempre — dados re-sincronizam do Firestore)
    try {
      indexedDB.deleteDatabase("gerentrack_cache");
      console.info("[CacheInvalidation] IndexedDB limpo.");
    } catch (err) {
      console.warn("[CacheInvalidation] Erro ao limpar IndexedDB:", err.message);
    }

    // 2. Limpar localStorage seletivamente (só quando schema muda)
    if (schemaMudou) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !PRESERVED_KEYS.has(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.info(`[CacheInvalidation] ${keysToRemove.length} chaves do localStorage limpas.`);
    }

    // 3. Registrar versões
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    localStorage.setItem(BUILD_KEY, BUILD_ID);

    return true;
  } catch (err) {
    console.error("[CacheInvalidation] Erro:", err);
    return false;
  }
}

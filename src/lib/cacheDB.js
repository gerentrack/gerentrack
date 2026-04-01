/**
 * cacheDB.js
 * Wrapper minimalista do IndexedDB para cache offline.
 * Substitui localStorage para atletas, equipes, inscrições, resultados e eventos.
 *
 * Stores: cache_atletas, cache_equipes, cache_inscricoes, cache_eventos (arrays com keyPath: "id")
 *         cache_resultados (dicionário convertido em records com keyPath: "key")
 */

const DB_NAME = "gerentrack_cache";
const DB_VERSION = 2;
const STORES = ["cache_atletas", "cache_equipes", "cache_inscricoes", "cache_eventos", "cache_resultados", "cache_numeracaoPeito"];
const DICT_STORES = new Set(["cache_resultados", "cache_numeracaoPeito"]);

let dbPromise = null;

/**
 * Abre (ou retorna) a conexão singleton do IndexedDB.
 * Na primeira abertura, cria os stores e migra dados do localStorage.
 */
function openCacheDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      STORES.forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const keyPath = DICT_STORES.has(storeName) ? "key" : "id";
          database.createObjectStore(storeName, { keyPath });
        }
      });
    };

    request.onsuccess = (event) => {
      const database = event.target.result;
      migrateFromLocalStorage(database).then(() => resolve(database));
    };

    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

/**
 * Migra dados do localStorage para IndexedDB (uma única vez).
 * Remove as chaves do localStorage após migração bem-sucedida.
 */
async function migrateFromLocalStorage(database) {
  for (const storeName of STORES) {
    try {
      const raw = localStorage.getItem(storeName);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      if (DICT_STORES.has(storeName)) {
        // Dicionário — converter para records { key, data }
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const records = Object.entries(parsed).map(([k, v]) => ({ key: k, data: v }));
          if (records.length > 0) {
            await writeToStore(database, storeName, records);
          }
        }
      } else {
        // Arrays — salvar diretamente
        if (Array.isArray(parsed) && parsed.length > 0) {
          await writeToStore(database, storeName, parsed);
        }
      }
      localStorage.removeItem(storeName);
    } catch { /* ignora erros de migração */ }
  }
}

/**
 * Escreve uma lista de records num store (clear + put).
 */
function writeToStore(database, storeName, records) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    records.forEach((record) => store.put(record));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Lê todos os itens de um store.
 * Para cache_resultados, reconstrói o dicionário a partir dos records.
 * @param {string} storeName
 * @returns {Promise<Array|Object>}
 */
export async function cacheGet(storeName) {
  try {
    const database = await openCacheDB();
    return new Promise((resolve) => {
      const tx = database.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        if (DICT_STORES.has(storeName)) {
          // Reconstruir dicionário { key: data }
          const dict = {};
          items.forEach((record) => { dict[record.key] = record.data; });
          resolve(dict);
        } else {
          resolve(items);
        }
      };
      request.onerror = () => resolve(DICT_STORES.has(storeName) ? {} : []);
    });
  } catch {
    return DICT_STORES.has(storeName) ? {} : [];
  }
}

/**
 * Salva dados num store (limpa e reescreve tudo).
 * Para cache_resultados, converte dicionário em records { key, data }.
 * @param {string} storeName
 * @param {Array|Object} data
 */
export async function cacheSet(storeName, data) {
  try {
    const database = await openCacheDB();
    let records;
    if (DICT_STORES.has(storeName)) {
      records = Object.entries(data || {}).map(([k, v]) => ({ key: k, data: v }));
    } else {
      records = Array.isArray(data) ? data : [];
    }
    await writeToStore(database, storeName, records);
  } catch { /* ignora erros de escrita */ }
}

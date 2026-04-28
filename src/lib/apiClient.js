/**
 * apiClient — chamadas à API Vercel com fallback local offline.
 *
 * Padrão: tenta API server-side; se offline ou erro, executa cálculo local.
 */
import { auth } from '../firebase';

async function getToken() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Chama a API com fallback para função local.
 *
 * @param {string} url — path relativo (ex: "/api/validar-inscricao")
 * @param {object} options — { method, body }
 * @param {Function} fallbackLocal — função que retorna o resultado localmente
 * @returns {Promise<any>} resultado da API ou do fallback
 */
export async function chamarApiComFallback(url, options, fallbackLocal) {
  // Se offline, fallback imediato
  if (!navigator.onLine) {
    return fallbackLocal();
  }

  const token = await getToken();
  if (!token) {
    return fallbackLocal();
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      console.warn(`API ${url} retornou ${res.status}, usando fallback local`);
      return fallbackLocal();
    }

    return await res.json();
  } catch (err) {
    console.warn(`API ${url} falhou, usando fallback local:`, err.message);
    return fallbackLocal();
  }
}

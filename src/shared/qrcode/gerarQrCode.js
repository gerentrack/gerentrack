import QRCode from "qrcode";

/**
 * Gera QR code público — URL para resultados da competição.
 * Mesmo QR para todos os atletas do evento (pré-renderizar uma vez).
 * @param {string} slug - Slug do evento
 * @returns {Promise<string>} Data URL (base64 PNG)
 */
export async function gerarQrPublico(slug) {
  const url = `https://gerentrack.com.br/competicao/${slug}/resultados`;
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Gera QR code da secretaria — dados inline para scan offline.
 * Um QR único por atleta.
 * @param {string} eventoId - ID do evento
 * @param {string} atletaId - ID do atleta
 * @param {number|string} numPeito - Número de peito
 * @returns {Promise<string>} Data URL (base64 PNG)
 */
export async function gerarQrSecretaria(eventoId, atletaId, numPeito) {
  const data = JSON.stringify({ t: "sec", e: eventoId, a: atletaId, n: Number(numPeito) });
  return QRCode.toDataURL(data, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Parseia dados de um QR code da secretaria.
 * @param {string} raw - Texto lido do QR
 * @returns {{ tipo: string, eventoId: string, atletaId: string, numPeito: number }|null}
 */
export function parsearQrSecretaria(raw) {
  try {
    const obj = JSON.parse(raw);
    if (obj.t === "sec" && obj.e && obj.a) {
      return { tipo: "secretaria", eventoId: obj.e, atletaId: obj.a, numPeito: obj.n || 0 };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * QrScanner.jsx
 * Componente reutilizável de scanner QR com:
 * - Modo contínuo (câmera permanece aberta)
 * - Feedback sensorial (cor + vibração + som)
 * - Contador flutuante
 * - Histórico dos últimos 5 scans com desfazer
 * - Fallback de digitação manual (nº peito)
 * - Alerta de duplicado
 * - Timeout de 5min de inatividade
 * - Toggle câmera frontal/traseira
 * - Botão lanterna
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTema } from "../TemaContext";

const INATIVIDADE_MS = 5 * 60 * 1000; // 5 minutos

export default function QrScanner({
  onScan,           // (dados: string) => { status, msg, cor } — callback ao escanear
  onDesfazer,       // (dados: string) => void — callback ao desfazer scan
  contadorLabel,    // string ex: "✓ 23/45 confirmados — 100m Sub-14 Masc"
  aberto,           // boolean — controla visibilidade
  onFechar,         // () => void — callback ao fechar
  provas,           // [{ id, label }] — lista de provas para seletor
  provaSelecionada, // string — id da prova selecionada
  onTrocarProva,    // (provaId: string) => void — callback ao trocar prova
}) {
  const t = useTema();
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [erro, setErro] = useState(null);
  const [usarFrontal, setUsarFrontal] = useState(false);
  const [lanterna, setLanterna] = useState(false);
  const [inputManual, setInputManual] = useState("");
  const [historico, setHistorico] = useState([]); // últimos 5 scans: { dados, status, msg, cor, ts }
  const [sessaoStats, setSessaoStats] = useState({ total: 0, bloqueados: 0, duplicados: 0 });
  const [sessaoInicio] = useState(Date.now());
  const [mostrarResumo, setMostrarResumo] = useState(false);

  const scannerRef = useRef(null);
  const scannerIdRef = useRef("qr-scanner-" + Date.now());
  // Ref para onScan — sempre a versão mais recente (evita closure stale no callback do scanner)
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const inatividadeRef = useRef(null);
  const ultimoScanRef = useRef(null);
  const processandoRef = useRef(false);

  // Resetar timeout de inatividade
  const resetInatividade = useCallback(() => {
    if (inatividadeRef.current) clearTimeout(inatividadeRef.current);
    inatividadeRef.current = setTimeout(() => {
      fecharScanner();
    }, INATIVIDADE_MS);
  }, []);

  // Iniciar câmera
  const iniciarCamera = useCallback(async () => {
    setErro(null);
    try {
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: usarFrontal ? "user" : "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (texto) => {
          if (processandoRef.current) return;
          const agora = Date.now();
          // Debounce: ignorar mesmo QR lido nos últimos 5s
          if (ultimoScanRef.current?.texto === texto && agora - ultimoScanRef.current.ts < 5000) return;
          processandoRef.current = true;
          ultimoScanRef.current = { texto, ts: agora };

          const resultado = onScanRef.current(texto);
          const res = resultado || { status: "erro", msg: "❌ QR não reconhecido", cor: "vermelho" };
          setHistorico(prev => [{ dados: texto, ...res, ts: agora }, ...prev].slice(0, 5));
          setSessaoStats(prev => ({
            total: prev.total + 1,
            bloqueados: prev.bloqueados + (res.cor === "vermelho" ? 1 : 0),
            duplicados: prev.duplicados + (res.cor === "azul" ? 1 : 0),
          }));
          resetInatividade();
          setTimeout(() => { processandoRef.current = false; }, 1500);
        },
        () => {} // erro de leitura contínua (ignorar)
      );

      setCameraAtiva(true);
      resetInatividade();
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
        setErro("permissao");
      } else if (err?.name === "NotFoundError" || err?.message?.includes("No camera")) {
        setErro("sem_camera");
      } else {
        setErro("generico");
      }
    }
  }, [usarFrontal, resetInatividade]);

  // Fechar câmera
  const fecharScanner = useCallback((mostrarRes = true) => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setCameraAtiva(false);
    setLanterna(false);
    if (inatividadeRef.current) clearTimeout(inatividadeRef.current);
    if (mostrarRes && sessaoStats.total > 0) {
      setMostrarResumo(true);
    } else {
      if (onFechar) onFechar();
    }
  }, [onFechar, sessaoStats.total]);

  // Toggle lanterna
  const toggleLanterna = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const track = scannerRef.current.getRunningTrackSettings?.()
        || scannerRef.current.getRunningTrackCapabilities?.();
      if (track) {
        const novoEstado = !lanterna;
        await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: novoEstado }] });
        setLanterna(novoEstado);
      }
    } catch {
      // Lanterna não suportada neste dispositivo
    }
  }, [lanterna]);

  // Input manual (fallback)
  const handleInputManual = () => {
    const val = inputManual.trim();
    if (!val) return;
    const resultado = onScanRef.current(val);
    const res = resultado || { status: "erro", msg: `❌ Nº ${val} não reconhecido`, cor: "vermelho" };
    setHistorico(prev => [{ dados: val, ...res, ts: Date.now(), manual: true }, ...prev].slice(0, 5));
    setSessaoStats(prev => ({
      total: prev.total + 1,
      bloqueados: prev.bloqueados + (res.cor === "vermelho" ? 1 : 0),
      duplicados: prev.duplicados + (res.cor === "azul" ? 1 : 0),
    }));
    setInputManual("");
    resetInatividade();
  };

  // Desfazer último scan
  const handleDesfazer = (item) => {
    if (onDesfazer) onDesfazer(item.dados);
    setHistorico(prev => prev.filter(h => h.ts !== item.ts));
    setSessaoStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  };

  // Fechar resumo
  const handleFecharResumo = () => {
    setMostrarResumo(false);
    if (onFechar) onFechar();
  };

  // Iniciar ao abrir
  useEffect(() => {
    if (aberto && !cameraAtiva && !erro) {
      // Delay para garantir que o DOM está pronto
      setTimeout(() => iniciarCamera(), 300);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      if (inatividadeRef.current) clearTimeout(inatividadeRef.current);
    };
  }, [aberto]);

  // Alternar câmera
  useEffect(() => {
    if (cameraAtiva) {
      fecharScanner();
      setMostrarResumo(false);
      setTimeout(() => iniciarCamera(), 500);
    }
  }, [usarFrontal]);

  if (!aberto) return null;

  const corFundo = {
    verde: `${t.success}22`,
    vermelho: `${t.danger}22`,
    amarelo: `${t.warning}22`,
    azul: `${t.accent}22`,
  };
  const corTexto = {
    verde: t.success,
    vermelho: t.danger,
    amarelo: t.warning,
    azul: t.accent,
  };

  // Resumo de sessão
  if (mostrarResumo) {
    const duracao = Math.round((Date.now() - sessaoInicio) / 1000);
    const min = Math.floor(duracao / 60);
    const seg = duracao % 60;
    return (
      <div style={{ position: "fixed", inset: 0, background: t.bgOverlay, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "28px 32px", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: t.textPrimary, marginBottom: 16 }}>
            Resumo da Sessão
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: t.success }}>{sessaoStats.total}</div>
              <div style={{ fontSize: 11, color: t.textDimmed }}>Escaneados</div>
            </div>
            {sessaoStats.bloqueados > 0 && <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: t.danger }}>{sessaoStats.bloqueados}</div>
              <div style={{ fontSize: 11, color: t.textDimmed }}>Bloqueados</div>
            </div>}
            {sessaoStats.duplicados > 0 && <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: t.accent }}>{sessaoStats.duplicados}</div>
              <div style={{ fontSize: 11, color: t.textDimmed }}>Duplicados</div>
            </div>}
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
            Duração: {min > 0 ? `${min}min ` : ""}{seg}s
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => { setMostrarResumo(false); iniciarCamera(); }}
              style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14 }}>
              Reabrir Scanner
            </button>
            <button onClick={handleFecharResumo}
              style={{ background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bgOverlay, zIndex: 9000, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: t.bgHeaderSolid, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: t.textPrimary, letterSpacing: 1 }}>
          📷 SCANNER QR
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setUsarFrontal(f => !f)} title="Alternar câmera"
            style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: t.textMuted }}>
            🔄
          </button>
          {cameraAtiva && (
            <button onClick={toggleLanterna} title="Lanterna"
              style={{ background: lanterna ? `${t.warning}22` : t.bgCardAlt, border: `1px solid ${lanterna ? t.warning : t.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: lanterna ? t.warning : t.textMuted }}>
              🔦
            </button>
          )}
          <button onClick={fecharScanner}
            style={{ background: t.bgCardAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: t.textMuted }}>
            ✕
          </button>
        </div>
      </div>

      {/* Seletor de prova */}
      {provas && provas.length > 0 && (
        <div style={{ background: t.bgHeaderSolid, padding: "8px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.textMuted, flexShrink: 0 }}>Prova:</span>
          <select
            value={provaSelecionada || ""}
            onChange={e => onTrocarProva && onTrocarProva(e.target.value)}
            style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 6, padding: "8px 10px", color: t.textPrimary, fontSize: 13, outline: "none" }}
          >
            <option value="">— Selecione a prova —</option>
            {provas.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Contador flutuante */}
      {contadorLabel && (
        <div style={{ background: `${t.accent}15`, padding: "8px 16px", textAlign: "center", fontSize: 13, fontWeight: 700, color: t.accent, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>
          {contadorLabel}
        </div>
      )}

      {/* Área da câmera */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Erro de permissão */}
        {erro === "permissao" && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
            <div style={{ color: t.danger, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Acesso à câmera negado</div>
            <div style={{ color: t.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Para escanear QR codes, permita o acesso à câmera nas configurações do navegador.
              <br />Em Chrome: ícone 🔒 na barra de endereço → Permissões → Câmera → Permitir.
            </div>
            <button onClick={() => { setErro(null); iniciarCamera(); }}
              style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Sem câmera */}
        {erro === "sem_camera" && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📵</div>
            <div style={{ color: t.warning, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Câmera não encontrada</div>
            <div style={{ color: t.textMuted, fontSize: 13 }}>Use o campo abaixo para digitar o nº de peito manualmente.</div>
          </div>
        )}

        {/* Erro genérico */}
        {erro === "generico" && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: t.warning, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Erro ao abrir a câmera</div>
            <button onClick={() => { setErro(null); iniciarCamera(); }}
              style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 8 }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Viewport da câmera */}
        {!erro && (
          <div id={scannerIdRef.current} style={{ width: "100%", maxWidth: 400, margin: "0 auto" }} />
        )}

        {/* Último feedback visual */}
        {historico.length > 0 && (
          <div style={{
            margin: "8px 16px", padding: "10px 16px", borderRadius: 8,
            background: corFundo[historico[0].cor] || t.bgCardAlt,
            border: `1px solid ${(corTexto[historico[0].cor] || t.textMuted) + "44"}`,
            textAlign: "center", fontSize: 14, fontWeight: 700,
            color: corTexto[historico[0].cor] || t.textMuted,
          }}>
            {historico[0].msg}
          </div>
        )}

        {/* Fallback: digitação manual */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 8 }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nº peito (manual)..."
            value={inputManual}
            onChange={e => setInputManual(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleInputManual(); }}
            style={{ flex: 1, background: t.bgInput, border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: "10px 14px", color: t.textPrimary, fontSize: 14, outline: "none" }}
          />
          <button onClick={handleInputManual}
            style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
            OK
          </button>
        </div>

        {/* Histórico dos últimos 5 scans */}
        {historico.length > 0 && (
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ fontSize: 11, color: t.textDimmed, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Últimos scans</div>
            {historico.map((item, i) => (
              <div key={item.ts} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "6px 10px", marginBottom: 4, borderRadius: 6,
                background: corFundo[item.cor] || t.bgCardAlt,
                border: `1px solid ${(corTexto[item.cor] || t.textMuted) + "22"}`,
                fontSize: 12,
              }}>
                <span style={{ color: corTexto[item.cor] || t.textMuted, fontWeight: 600, flex: 1 }}>
                  {item.manual ? "⌨️ " : "📷 "}{item.msg}
                </span>
                <span style={{ color: t.textDisabled, fontSize: 10, flexShrink: 0 }}>
                  {new Date(item.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                {i === 0 && onDesfazer && item.cor === "verde" && (
                  <button onClick={() => handleDesfazer(item)}
                    style={{ background: "transparent", border: `1px solid ${t.danger}44`, color: t.danger, borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    Desfazer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

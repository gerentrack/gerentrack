import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTema } from "./TemaContext";

/**
 * Modal de corte de imagem antes do upload.
 * - 4 handles nos cantos para redimensionar livremente
 * - Arrastar a área de crop para mover
 * - Botão remover fundo (IA, carregado sob demanda)
 */
export default function CortarImagem({ imageSrc, aspecto, onConfirmar, onCancelar }) {
  const t = useTema();
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [imgCarregada, setImgCarregada] = useState(false);
  const [removendoFundo, setRemovendoFundo] = useState(false);
  const [imgAtual, setImgAtual] = useState(imageSrc);
  const [fundoRemovido, setFundoRemovido] = useState(false);
  const dragging = useRef(null); // { type: "move"|handle, startX, startY, origCrop }

  // Crop inicial
  useEffect(() => {
    if (!imgCarregada) return;
    setCrop({ x: 5, y: 5, w: 90, h: 90 });
  }, [imgCarregada]);

  const startDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = { type, startX: e.clientX, startY: e.clientY, origCrop: { ...crop } };
  }, [crop]);

  const startDragTouch = useCallback((e, type) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation() }, type);
  }, [startDrag]);

  useEffect(() => {
    const onMove = (clientX, clientY) => {
      const d = dragging.current;
      if (!d || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((clientX - d.startX) / rect.width) * 100;
      const dy = ((clientY - d.startY) / rect.height) * 100;
      const o = d.origCrop;

      if (d.type === "move") {
        setCrop({
          ...o,
          x: Math.max(0, Math.min(100 - o.w, o.x + dx)),
          y: Math.max(0, Math.min(100 - o.h, o.y + dy)),
        });
      } else {
        let nx = o.x, ny = o.y, nw = o.w, nh = o.h;

        if (d.type.includes("r")) { nw = o.w + dx; }
        if (d.type.includes("l")) { nx = o.x + dx; nw = o.w - dx; }
        if (d.type.includes("b")) { nh = o.h + dy; }
        if (d.type.includes("t")) { ny = o.y + dy; nh = o.h - dy; }

        // Limites mínimos
        if (nw < 5) { if (d.type.includes("l")) nx = o.x + o.w - 5; nw = 5; }
        if (nh < 5) { if (d.type.includes("t")) ny = o.y + o.h - 5; nh = 5; }
        nx = Math.max(0, nx);
        ny = Math.max(0, ny);
        nw = Math.min(nw, 100 - nx);
        nh = Math.min(nh, 100 - ny);

        setCrop({ x: nx, y: ny, w: nw, h: nh });
      }
    };

    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (!dragging.current || e.touches.length !== 1) return;
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => { dragging.current = null; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const removerFundo = useCallback(async () => {
    if (removendoFundo) return;
    setRemovendoFundo(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(imgAtual, { output: { format: "image/png" } });
      const url = URL.createObjectURL(blob);
      setImgAtual(url);
      setFundoRemovido(true);
      setImgCarregada(false);
    } catch (err) {
      alert("Erro ao remover fundo: " + (err.message || "tente novamente."));
    } finally {
      setRemovendoFundo(false);
    }
  }, [imgAtual, removendoFundo]);

  const confirmar = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const sx = (crop.x / 100) * img.naturalWidth;
    const sy = (crop.y / 100) * img.naturalHeight;
    const sw = (crop.w / 100) * img.naturalWidth;
    const sh = (crop.h / 100) * img.naturalHeight;

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => { if (blob) onConfirmar(blob); }, "image/png", 0.92);
  }, [crop, onConfirmar]);

  const handles = [
    { key: "tl", cursor: "nwse-resize", style: { top: -6, left: -6 } },
    { key: "tr", cursor: "nesw-resize", style: { top: -6, right: -6 } },
    { key: "bl", cursor: "nesw-resize", style: { bottom: -6, left: -6 } },
    { key: "br", cursor: "nwse-resize", style: { bottom: -6, right: -6 } },
  ];

  // Handle para as bordas (top, bottom, left, right)
  const edgeHandles = [
    { key: "t", cursor: "ns-resize", style: { top: -4, left: "20%", right: "20%", height: 8 } },
    { key: "b", cursor: "ns-resize", style: { bottom: -4, left: "20%", right: "20%", height: 8 } },
    { key: "l", cursor: "ew-resize", style: { left: -4, top: "20%", bottom: "20%", width: 8 } },
    { key: "r", cursor: "ew-resize", style: { right: -4, top: "20%", bottom: "20%", width: 8 } },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: t.bgCard, borderRadius: 14, border: `1px solid ${t.border}`,
        padding: 20, maxWidth: 600, width: "100%",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: t.textPrimary, marginBottom: 14 }}>
          Recortar Imagem
        </div>

        {/* Área de crop */}
        <div
          ref={containerRef}
          style={{
            position: "relative", width: "100%",
            background: fundoRemovido
              ? "repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 20px 20px"
              : "#000",
            borderRadius: 8, overflow: "hidden",
            marginBottom: 16, userSelect: "none", touchAction: "none",
          }}
        >
          <img
            ref={imgRef}
            src={imgAtual}
            alt=""
            crossOrigin="anonymous"
            onLoad={() => setImgCarregada(true)}
            style={{ display: "block", width: "100%", height: "auto", opacity: 0.4 }}
          />

          {imgCarregada && (
            <>
              {/* Área selecionada */}
              <div style={{
                position: "absolute",
                left: `${crop.x}%`, top: `${crop.y}%`,
                width: `${crop.w}%`, height: `${crop.h}%`,
                overflow: "hidden", cursor: "move",
                border: `2px solid ${t.accent}`,
                boxSizing: "border-box",
              }}
                onMouseDown={e => startDrag(e, "move")}
                onTouchStart={e => startDragTouch(e, "move")}
              >
                <img
                  src={imgAtual}
                  alt=""
                  style={{
                    position: "absolute",
                    width: `${100 / (crop.w / 100)}%`,
                    height: `${100 / (crop.h / 100)}%`,
                    left: `-${crop.x / crop.w * 100}%`,
                    top: `-${crop.y / crop.h * 100}%`,
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* 4 handles de canto */}
              {handles.map(h => (
                <div
                  key={h.key}
                  onMouseDown={e => startDrag(e, h.key)}
                  onTouchStart={e => startDragTouch(e, h.key)}
                  style={{
                    position: "absolute",
                    ...( h.key === "tl" ? { left: `calc(${crop.x}% - 6px)`, top: `calc(${crop.y}% - 6px)` } :
                         h.key === "tr" ? { left: `calc(${crop.x + crop.w}% - 6px)`, top: `calc(${crop.y}% - 6px)` } :
                         h.key === "bl" ? { left: `calc(${crop.x}% - 6px)`, top: `calc(${crop.y + crop.h}% - 6px)` } :
                                          { left: `calc(${crop.x + crop.w}% - 6px)`, top: `calc(${crop.y + crop.h}% - 6px)` }),
                    width: 14, height: 14,
                    background: "#fff", border: `2px solid ${t.accent}`,
                    borderRadius: 3, cursor: h.cursor, zIndex: 5,
                  }}
                />
              ))}

              {/* Handles de borda (top, bottom, left, right) */}
              {edgeHandles.map(h => (
                <div
                  key={h.key}
                  onMouseDown={e => startDrag(e, h.key)}
                  onTouchStart={e => startDragTouch(e, h.key)}
                  style={{
                    position: "absolute",
                    ...(h.key === "t" ? { left: `calc(${crop.x}% + 20%)`, top: `calc(${crop.y}% - 4px)`, width: `calc(${crop.w}% * 0.6)`, height: 8 } :
                        h.key === "b" ? { left: `calc(${crop.x}% + 20%)`, top: `calc(${crop.y + crop.h}% - 4px)`, width: `calc(${crop.w}% * 0.6)`, height: 8 } :
                        h.key === "l" ? { left: `calc(${crop.x}% - 4px)`, top: `calc(${crop.y}% + 20%)`, width: 8, height: `calc(${crop.h}% * 0.6)` } :
                                        { left: `calc(${crop.x + crop.w}% - 4px)`, top: `calc(${crop.y}% + 20%)`, width: 8, height: `calc(${crop.h}% * 0.6)` }),
                    cursor: h.cursor, zIndex: 4,
                    background: "transparent",
                  }}
                />
              ))}
            </>
          )}
        </div>

        {removendoFundo && (
          <div style={{
            padding: "10px 14px", background: t.accentBg, border: `1px solid ${t.accentBorder}`,
            borderRadius: 8, marginBottom: 12, fontSize: 12, color: t.accent, textAlign: "center",
          }}>
            Processando remoção de fundo... Isso pode levar alguns segundos na primeira vez (download do modelo IA).
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Botões */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <button
            onClick={removerFundo}
            disabled={removendoFundo}
            style={{
              background: fundoRemovido ? t.success + "22" : t.bgInput,
              border: `1px solid ${fundoRemovido ? t.success : t.borderInput}`,
              color: removendoFundo ? t.textDisabled : fundoRemovido ? t.success : t.textSecondary,
              padding: "8px 16px", borderRadius: 8,
              cursor: removendoFundo ? "not-allowed" : "pointer",
              fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
            }}
          >
            {removendoFundo ? "Removendo fundo..." : fundoRemovido ? "✓ Fundo removido" : "Remover fundo"}
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onCancelar}
              style={{
                background: "transparent", border: `1px solid ${t.borderInput}`,
                color: t.textMuted, padding: "8px 20px", borderRadius: 8,
                cursor: "pointer", fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={removendoFundo}
              style={{
                background: removendoFundo ? t.bgInput : `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                color: removendoFundo ? t.textDisabled : "#fff",
                border: "none", padding: "8px 24px", borderRadius: 8,
                cursor: removendoFundo ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Confirmar Recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

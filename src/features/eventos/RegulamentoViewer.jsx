import { useState, useEffect } from "react";

export default function RegulamentoViewer({ eventoAtual, tema: _t }) {
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const url = eventoAtual?.regulamentoUrl;

  useEffect(() => {
    if (!url) { setStatus("error"); return; }
    setStatus("loading");
    fetch(url, { method: "HEAD" })
      .then(r => setStatus(r.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [url]);

  if (!url || status === "error") return (
    <div style={{ textAlign:"center", padding:60, color:_t.textDimmed }}>
      <div style={{ fontSize:16, marginBottom:12, color:_t.textDimmed }}>Documento</div>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>Regulamento indisponível</div>
      <div style={{ fontSize:13 }}>O arquivo foi removido ou não está acessível.</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 80px)", padding:"16px 24px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontFamily: _t.fontTitle, fontSize:20, fontWeight:700, color:_t.textPrimary }}>
          {eventoAtual.regulamentoNome || "Regulamento"}
        </div>
        <a href={url} download={eventoAtual.regulamentoNome || "regulamento.pdf"}
          style={{ background:`linear-gradient(135deg, ${_t.accent}, ${_t.accentDark})`, color:"#fff", border:"none", padding:"8px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily: _t.fontTitle, letterSpacing:1, textDecoration:"none" }}>
          Download
        </a>
      </div>
      <div style={{ flex:1, position:"relative", borderRadius:10, overflow:"hidden", border:`1px solid ${_t.border}` }}>
        {status === "loading" && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:_t.bgCard, zIndex:2 }}>
            <span style={{ fontSize:14, color:_t.textDimmed }}>Carregando regulamento…</span>
          </div>
        )}
        <iframe src={url} loading="lazy" onLoad={() => setStatus("ok")} style={{ position:"relative", width:"100%", height:"100%", border:"none", zIndex:1, background:"transparent" }} title="Regulamento" />
      </div>
    </div>
  );
}

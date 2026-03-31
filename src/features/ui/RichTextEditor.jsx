import React, { useState, useEffect, useRef } from "react";
import { useTema } from "../../shared/TemaContext";

function RichTextEditor({ value, onChange, placeholder }) {
  const t = useTema();
  const editorRef = useRef(null);
  const [iniciado, setIniciado] = useState(false);

  useEffect(() => {
    if (editorRef.current && !iniciado) {
      editorRef.current.innerHTML = value || "";
      setIniciado(true);
    }
  }, [value, iniciado]);

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const [, forceUpdate] = useState(0);
  const handleSelect = () => forceUpdate(n => n + 1);

  const btnStyle = (active) => ({
    padding: "4px 10px", border: `1px solid ${active ? t.accent : t.borderLight}`, cursor: "pointer",
    borderRadius: 4, fontSize: 13, fontFamily: "Inter, sans-serif", minWidth: 32,
    background: active ? t.accent : t.bgHeaderSolid,
    color: active ? "#000" : t.textTertiary,
    fontWeight: active ? 700 : 400,
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8, padding:"6px 8px",
        background:t.bgHeaderSolid, border:`1px solid ${t.borderLight}`, borderRadius:"6px 6px 0 0" }}>
        <button type="button" onClick={() => execCmd("bold")} style={btnStyle(isActive("bold"))} title="Negrito (Ctrl+B)">
          <strong>N</strong>
        </button>
        <button type="button" onClick={() => execCmd("underline")} style={btnStyle(isActive("underline"))} title="Sublinhado (Ctrl+U)">
          <span style={{ textDecoration:"underline" }}>S</span>
        </button>
        <button type="button" onClick={() => execCmd("italic")} style={btnStyle(isActive("italic"))} title="Itálico (Ctrl+I)">
          <em>I</em>
        </button>
        <div style={{ width:1, background:t.borderLight, margin:"0 4px" }} />
        <button type="button" onClick={() => execCmd("insertUnorderedList")} style={btnStyle(isActive("insertUnorderedList"))} title="Lista">
          ☰
        </button>
        <button type="button" onClick={() => execCmd("removeFormat")} style={btnStyle(false)} title="Limpar formatação">
          🧹
        </button>
        <div style={{ width:1, background:t.borderLight, margin:"0 4px" }} />
        <button type="button" onClick={() => execCmd("justifyLeft")} style={btnStyle(false)} title="Alinhar à esquerda">
          ≡
        </button>
        <button type="button" onClick={() => execCmd("justifyCenter")} style={btnStyle(false)} title="Centralizar">
          ⊜
        </button>
        <button type="button" onClick={() => execCmd("justifyFull")} style={btnStyle(false)} title="Justificar">
          ☰
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const texto = e.clipboardData.getData("text/plain").replace(/ {2,}/g, " ");
          const paragrafos = texto.split(/\n+/).filter(p => p.trim());
          const html = paragrafos.map(p => `<p style="margin:0 0 0.5em 0;text-align:justify">${p.trim()}</p>`).join("");
          document.execCommand("insertHTML", false, html);
        }}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        data-placeholder={placeholder}
        style={{
          minHeight: 140, maxHeight: 400, overflowY: "auto",
          padding: "12px 16px",
          background: t.bgCardAlt, border: `1px solid ${t.borderLight}`, borderTop: "none",
          borderRadius: "0 0 6px 6px", color: t.textSecondary,
          fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.7,
          outline: "none", whiteSpace: "pre-wrap", wordBreak: "break-word",
          textAlign: "justify",
        }}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #444;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export default RichTextEditor;

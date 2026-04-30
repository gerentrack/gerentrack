import { temaDark } from "../tema";

const cssGlobal = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0A0B0D; color: #E0E0E0; font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  optgroup { background: ${temaDark.bgHover}; color: #1976D2; font-style: normal; }
  option { background: ${temaDark.bgHover}; color: #E0E0E0; }

  /* ── Modo Claro ── */
  .tema-claro { background: #F0F1F3 !important; color: #1A1A1A !important; }
  .tema-claro ::-webkit-scrollbar-track { background: #E8E8E8; }
  .tema-claro ::-webkit-scrollbar-thumb { background: #BBB; }
  .tema-claro optgroup { background: #fff; color: #1565C0; }
  .tema-claro option { background: #fff; color: #1A1A1A; }
  .tema-claro input, .tema-claro select, .tema-claro textarea {
    background: #FFFFFF !important; border-color: #CDD1D9 !important; color: #333 !important;
  }
  .tema-claro input:focus, .tema-claro select:focus, .tema-claro textarea:focus {
    border-color: #1565C0 !important; box-shadow: 0 0 0 2px #1565C022 !important;
  }
  .tema-claro table { border-color: #D8DCE3 !important; }
  .tema-claro th { background: #F0F1F3 !important; color: #333 !important; border-color: #D8DCE3 !important; }
  .tema-claro td { border-color: #E0E3EA !important; }
  .tema-claro thead tr { background: #F0F1F3 !important; }
  .tema-claro tr:hover td { background: #F0F2F5 !important; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  main > * { animation: fadeIn 0.25s ease; }

  button:not([disabled]):hover { filter: brightness(1.12); }
  button:not([disabled]):active { transform: scale(0.97); }

  input:focus, select:focus { border-color: #1976D2 !important; box-shadow: 0 0 0 2px #1976D222; }

  tr:hover td { background: ${temaDark.bgHover} !important; }

  .saved-pulse { animation: pulse 1s ease 2; }
`;

export default cssGlobal;

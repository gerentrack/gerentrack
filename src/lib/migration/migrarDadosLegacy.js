/**
 * migrarDadosLegacy
 *
 * Migração síncrona de dados legados no localStorage.
 * Executada UMA VEZ antes do React montar (IIFE).
 *
 * Migrações incluídas:
 *  1. Usuário logado: tipo "treinador" → "equipe"
 *  2. Solicitações de vínculo: origem/aprovadorTipo "treinador" → "equipe"
 *  3. Solicitações de recuperação: tipo "treinador" → "equipe"
 *  4. Inscrições: campo treinadorCadastro → equipeCadastroId
 *  5. Recordes: adiciona escopo geográfico + migra registros para formato detentores[]
 *
 * Extraído de App.jsx (linha 117) — Etapa 1 da refatoração.
 */
export function migrarDadosLegacy() {
  try {
    // ── 1. Usuário logado ──────────────────────────────────────────────────────
    const raw = window.localStorage.getItem("atl_usuario");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.tipo === "treinador") {
        u.tipo = "equipe";
        window.localStorage.setItem("atl_usuario", JSON.stringify(u));
      }
    }

    // ── 2. Solicitações de vínculo (origem + aprovadorTipo) ──────────────────
    const rawVinc = window.localStorage.getItem("atl_vinculo_sol");
    if (rawVinc) {
      const arr = JSON.parse(rawVinc);
      let changed = false;
      const migrado = arr.map((s) => {
        let n = s;
        if (s.origem === "treinador") {
          n = { ...n, origem: "equipe" };
          changed = true;
        }
        if (s.aprovadorTipo === "treinador_atual") {
          n = { ...n, aprovadorTipo: "equipe_atual" };
          changed = true;
        }
        return n;
      });
      if (changed) {
        window.localStorage.setItem("atl_vinculo_sol", JSON.stringify(migrado));
      }
    }

    // ── 3. Solicitações de recuperação ────────────────────────────────────────
    const rawRec = window.localStorage.getItem("atl_recuperacao");
    if (rawRec) {
      const arr = JSON.parse(rawRec);
      if (Array.isArray(arr) && arr.some((s) => s.tipo === "treinador")) {
        window.localStorage.setItem(
          "atl_recuperacao",
          JSON.stringify(arr.map((s) => (s.tipo === "treinador" ? { ...s, tipo: "equipe" } : s)))
        );
      }
    }

    // ── 4. Inscrições: treinadorCadastro → equipeCadastroId ──────────────────
    const rawInsc = window.localStorage.getItem("atl_inscricoes");
    if (rawInsc) {
      const arr = JSON.parse(rawInsc);
      if (Array.isArray(arr) && arr.some((s) => s.treinadorCadastro !== undefined)) {
        window.localStorage.setItem(
          "atl_inscricoes",
          JSON.stringify(
            arr.map((s) => {
              if (s.treinadorCadastro !== undefined) {
                const { treinadorCadastro, ...rest } = s;
                return { ...rest, equipeCadastroId: treinadorCadastro };
              }
              return s;
            })
          )
        );
      }
    }

    // ── 5. Recordes: escopo geográfico + formato detentores[] ─────────────────
    const rawRecordes = window.localStorage.getItem("atl_recordes");
    if (rawRecordes) {
      const arr = JSON.parse(rawRecordes);
      let changed = false;

      const migrated = arr.map((tipo) => {
        let t = tipo;

        // Adiciona escopo geográfico padrão
        if (!t.escopo) {
          t = { ...t, escopo: "estado", pais: "Brasil", estado: "MG", municipio: null };
          changed = true;
        }

        // Migra registros do formato antigo para detentores[]
        if (t.registros && t.registros.some((r) => !Array.isArray(r.detentores))) {
          t = {
            ...t,
            registros: t.registros.map((r) => {
              if (Array.isArray(r.detentores)) return r;
              changed = true;
              const {
                atleta, equipe, atletaId, ano, local,
                competicaoId, competicaoNome, atletasRevezamento,
                ...base
              } = r;
              return {
                ...base,
                detentores: [{
                  atleta:            atleta            || "",
                  equipe:            equipe            || "",
                  atletaId:          atletaId          || null,
                  ano:               ano               || "",
                  local:             local             || "",
                  competicaoId:      competicaoId      || null,
                  competicaoNome:    competicaoNome    || "",
                  atletasRevezamento: atletasRevezamento || null,
                }],
              };
            }),
          };
        }

        return t;
      });

      if (changed) {
        window.localStorage.setItem("atl_recordes", JSON.stringify(migrated));
      }
    }
    // ── 6. Remover campo senha de dados legados ───────────────────────────────
    // Senha nunca deve ficar no localStorage — migração para Firebase Auth.
    const chavesSensiveis = [
      "atl_organizadores",
      "atl_atletas_usuarios",
      "atl_funcionarios",
      "atl_treinadores",
    ];
    chavesSensiveis.forEach((chave) => {
      const raw = window.localStorage.getItem(chave);
      if (!raw) return;
      try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return;
        if (!arr.some((u) => u.senha !== undefined)) return; // nada a fazer
        const limpo = arr.map(({ senha, ...resto }) => resto);
        window.localStorage.setItem(chave, JSON.stringify(limpo));
      } catch { /* ignora erro de parse individual */ }
    });

    // Limpa senha do usuário logado se ainda estiver lá
    const rawUsuario = window.localStorage.getItem("atl_usuario");
    if (rawUsuario) {
      try {
        const u = JSON.parse(rawUsuario);
        if (u && u.senha !== undefined) {
          const { senha, ...uSemSenha } = u;
          window.localStorage.setItem("atl_usuario", JSON.stringify(uSemSenha));
        }
      } catch { /* ignora */ }
    }

  } catch (e) {
    console.warn("Migração dados legados:", e);
  }
}

// Executa imediatamente ao importar este módulo (antes do React montar)
migrarDadosLegacy();

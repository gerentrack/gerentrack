/**
 * Script de migração: mover atletas femininas do M_sub14_tetratlo para F_sub14_tetratlo
 *
 * Executar no console do browser com o app rodando (localhost:5173).
 * Cole este código no console e chame: await migrarTetratloFeminino()
 *
 * O que faz:
 * 1. Encontra o evento pelo slug
 * 2. Encontra atletas femininas inscritas no M_sub14_tetratlo
 * 3. Atualiza inscrição pai: provaId M→F
 * 4. Remove inscrições componentes antigas (M)
 * 5. Cria inscrições componentes novas (F)
 * 6. Migra resultados: copia entries do doc antigo para o novo, remove do antigo
 * 7. NÃO perde nenhum resultado digitado
 */

async function migrarTetratloFeminino() {
  // Importar Firebase do app + funções extras do SDK
  const firebase = await import('/src/firebase.js');
  const { db, collection, doc, setDoc, getDoc, writeBatch, deleteDoc } = firebase;
  const firestore = await import('firebase/firestore');
  const { getDocs, query, where } = firestore;

  const EVENTO_BUSCA = "Mineiro";
  const COMBINADA_ANTIGA = "M_sub14_tetratlo";
  const COMBINADA_NOVA = "F_sub14_tetratlo";

  // Sufixos dos componentes do tetratlo (4 provas)
  const COMPONENTES = [
    { idx: 0, sufixo: "60mB" },
    { idx: 1, sufixo: "peso" },
    { idx: 2, sufixo: "comp" },
    { idx: 3, sufixo: "800m" },
  ];

  // 1. Encontrar o evento
  console.log("🔍 Buscando evento com nome contendo:", EVENTO_BUSCA);
  const eventosSnap = await getDocs(collection(db, "eventos"));
  const candidatos = [];
  eventosSnap.forEach(d => {
    const data = d.data();
    if (data.nome && data.nome.includes(EVENTO_BUSCA) && data.nome.includes("Sub-14")) candidatos.push({ id: d.id, ...data });
  });
  if (candidatos.length === 0) { console.error("❌ Nenhum evento encontrado com:", EVENTO_BUSCA); return; }
  if (candidatos.length > 1) {
    console.warn("⚠️ Múltiplos eventos encontrados:");
    candidatos.forEach(e => console.log(`   - ${e.nome} (${e.id})`));
    console.log("Usando o primeiro.");
  }
  const evento = candidatos[0];
  console.log("✅ Evento:", evento.nome, "| ID:", evento.id);
  const eid = evento.id;

  // 2. Buscar inscrições do evento
  console.log("🔍 Buscando inscrições...");
  const inscsSnap = await getDocs(query(collection(db, "inscricoes"), where("eventoId", "==", eid)));
  const todasInscs = [];
  inscsSnap.forEach(d => todasInscs.push({ id: d.id, ...d.data() }));
  console.log(`   Total de inscrições no evento: ${todasInscs.length}`);

  // 3. Encontrar inscrições "pai" femininas no tetratlo masculino
  const inscsPaiParaMigrar = todasInscs.filter(i =>
    i.provaId === COMBINADA_ANTIGA && i.sexo === "F" && !i.origemCombinada
  );
  console.log(`📋 Inscrições pai femininas em ${COMBINADA_ANTIGA}: ${inscsPaiParaMigrar.length}`);
  if (inscsPaiParaMigrar.length === 0) {
    console.log("✅ Nenhuma migração necessária.");
    return;
  }
  inscsPaiParaMigrar.forEach(i => console.log(`   - ${i.atletaNome || i.atletaId}`));

  // 4. Encontrar inscrições componentes dessas atletas
  const atletaIds = new Set(inscsPaiParaMigrar.map(i => i.atletaId));
  const inscsCompAntigas = todasInscs.filter(i =>
    atletaIds.has(i.atletaId) && i.combinadaId === COMBINADA_ANTIGA && i.origemCombinada
  );
  console.log(`📋 Inscrições componentes antigas para remover: ${inscsCompAntigas.length}`);

  // 5. Verificar se Pietra (que já está no F) também precisa de ajuste
  const inscsPaiJaNoF = todasInscs.filter(i =>
    i.provaId === COMBINADA_NOVA && i.sexo === "F" && !i.origemCombinada
  );
  console.log(`📋 Atletas já no ${COMBINADA_NOVA}: ${inscsPaiJaNoF.length}`);
  inscsPaiJaNoF.forEach(i => console.log(`   - ${i.atletaNome || i.atletaId} (já correto)`));

  // 6. Preparar IDs de componentes antigos e novos
  const compIdAntigo = (idx, sufixo) => `${eid}_COMB_${COMBINADA_ANTIGA}_${idx}_${sufixo}`;
  const compIdNovo   = (idx, sufixo) => `${eid}_COMB_${COMBINADA_NOVA}_${idx}_${sufixo}`;

  // 7. Migrar resultados
  console.log("\n📦 Migrando resultados...");
  const catId = "sub14";
  const sexo = "F";

  for (const comp of COMPONENTES) {
    const provaIdAntiga = compIdAntigo(comp.idx, comp.sufixo);
    const provaIdNova   = compIdNovo(comp.idx, comp.sufixo);
    const chaveAntiga = `${eid}_${provaIdAntiga}_${catId}_${sexo}`;
    const chaveNova   = `${eid}_${provaIdNova}_${catId}_${sexo}`;

    console.log(`\n   Componente: ${comp.sufixo}`);
    console.log(`   Chave antiga: ${chaveAntiga}`);
    console.log(`   Chave nova:   ${chaveNova}`);

    // Ler resultado antigo
    const docAntigo = await getDoc(doc(db, "resultados", chaveAntiga));
    if (!docAntigo.exists()) {
      console.log(`   ⚠️  Sem resultados na chave antiga`);
      continue;
    }
    const dadosAntigos = docAntigo.data();

    // Filtrar apenas entries das atletas que estão migrando
    const entriesParaMigrar = {};
    const entriesParaManter = {};
    Object.entries(dadosAntigos).forEach(([aid, val]) => {
      if (atletaIds.has(aid)) {
        entriesParaMigrar[aid] = val;
      } else {
        entriesParaManter[aid] = val;
      }
    });
    console.log(`   Entries para migrar: ${Object.keys(entriesParaMigrar).length}`);
    console.log(`   Entries para manter na chave antiga: ${Object.keys(entriesParaManter).length}`);

    if (Object.keys(entriesParaMigrar).length === 0) continue;

    // Ler resultado novo (pode já ter entries, ex: Pietra)
    const docNovo = await getDoc(doc(db, "resultados", chaveNova));
    const dadosNovos = docNovo.exists() ? docNovo.data() : {};

    // Mesclar entries migradas com existentes
    const dadosMesclados = { ...dadosNovos, ...entriesParaMigrar };
    console.log(`   Entries no doc novo após merge: ${Object.keys(dadosMesclados).length}`);

    // Gravar doc novo
    await setDoc(doc(db, "resultados", chaveNova), dadosMesclados);
    console.log(`   ✅ Resultados gravados em ${chaveNova}`);

    // Atualizar doc antigo (remover entries migradas, manter as demais)
    if (Object.keys(entriesParaManter).length > 0) {
      await setDoc(doc(db, "resultados", chaveAntiga), entriesParaManter);
      console.log(`   ✅ Chave antiga atualizada (manteve ${Object.keys(entriesParaManter).length} entries)`);
    } else {
      await deleteDoc(doc(db, "resultados", chaveAntiga));
      console.log(`   🗑️  Chave antiga removida (vazia)`);
    }
  }

  // 8. Atualizar inscrições em lotes
  console.log("\n📦 Atualizando inscrições...");
  const LOTE = 400;

  // 8a. Atualizar inscrições pai: provaId M→F
  for (let i = 0; i < inscsPaiParaMigrar.length; i += LOTE) {
    const batch = writeBatch(db);
    inscsPaiParaMigrar.slice(i, i + LOTE).forEach(insc => {
      batch.update(doc(db, "inscricoes", insc.id), { provaId: COMBINADA_NOVA });
    });
    await batch.commit();
  }
  console.log(`✅ ${inscsPaiParaMigrar.length} inscrições pai atualizadas (provaId → ${COMBINADA_NOVA})`);

  // 8b. Remover inscrições componentes antigas
  for (let i = 0; i < inscsCompAntigas.length; i += LOTE) {
    const batch = writeBatch(db);
    inscsCompAntigas.slice(i, i + LOTE).forEach(insc => {
      batch.delete(doc(db, "inscricoes", insc.id));
    });
    await batch.commit();
  }
  console.log(`🗑️  ${inscsCompAntigas.length} inscrições componentes antigas removidas`);

  // 8c. Criar novas inscrições componentes
  const novasInscs = [];
  const baseTs = Date.now();
  inscsPaiParaMigrar.forEach((pai, pi) => {
    COMPONENTES.forEach((comp, ci) => {
      const provaIdNova = compIdNovo(comp.idx, comp.sufixo);
      novasInscs.push({
        id: `${eid}_${pai.atletaId}_COMB_${provaIdNova}_${baseTs + pi * 10 + ci}`,
        eventoId: eid,
        atletaId: pai.atletaId,
        provaId: provaIdNova,
        combinadaId: COMBINADA_NOVA,
        origemCombinada: true,
        categoria: pai.categoria,
        categoriaId: pai.categoriaId,
        categoriaOficial: pai.categoriaOficial,
        categoriaOficialId: pai.categoriaOficialId,
        sexo: pai.sexo,
        data: new Date().toISOString(),
        inscritoPorId: pai.inscritoPorId,
        inscritoPorNome: pai.inscritoPorNome,
        inscritoPorTipo: pai.inscritoPorTipo,
        equipeCadastro: pai.equipeCadastro || "",
        equipeCadastroId: pai.equipeCadastroId || null,
        atletaNome: pai.atletaNome,
      });
    });
  });

  for (let i = 0; i < novasInscs.length; i += LOTE) {
    const batch = writeBatch(db);
    novasInscs.slice(i, i + LOTE).forEach(insc => {
      batch.set(doc(db, "inscricoes", insc.id), insc);
    });
    await batch.commit();
  }
  console.log(`✅ ${novasInscs.length} novas inscrições componentes criadas (${COMBINADA_NOVA})`);

  console.log("\n🎉 Migração concluída! Recarregue a página (F5) para ver as mudanças.");
  console.log("   Todos os resultados foram preservados.");
}

// Para executar, cole no console e chame:
// await migrarTetratloFeminino()

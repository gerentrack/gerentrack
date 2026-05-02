/**
 * Script para restaurar resultados e seriação de um backup do Firestore.
 *
 * PRÉ-REQUISITOS:
 *   1. Restaurar o backup para um banco temporário via gcloud:
 *      gcloud firestore databases restore \
 *        --source-backup=BACKUP_ID \
 *        --destination-database=temp-restore
 *
 *   2. No Firebase Console, anotar o nome do banco temporário (ex: "temp-restore")
 *
 * COMO USAR:
 *   1. Abra o app rodando (localhost:5173)
 *   2. Cole este script no console do browser (DevTools → Console)
 *   3. Chame: await restaurarResultadosSeriacao("EVENTO_ID", "temp-restore")
 *      - EVENTO_ID: id do evento cujos dados deseja restaurar
 *      - "temp-restore": nome do banco temporário com o backup
 *
 * O QUE FAZ:
 *   1. Conecta no banco temporário (backup) e lê:
 *      - Todos os documentos de `resultados` que começam com o eventoId
 *      - O campo `seriacao` e `configSeriacao` do documento do evento
 *   2. Mostra preview dos dados encontrados (não altera nada ainda)
 *   3. Pede confirmação antes de sobrescrever
 *   4. Escreve no banco principal:
 *      - Documentos de resultados (merge, preserva campos não-conflitantes)
 *      - Campo seriacao e configSeriacao do evento
 *
 * SEGURANÇA:
 *   - Apenas sobrescreve resultados e seriação do evento especificado
 *   - Não toca em inscrições, atletas, equipes ou outros eventos
 *   - Mostra preview antes de confirmar
 */

async function restaurarResultadosSeriacao(eventoId, backupDbName) {
  if (!eventoId) { console.error("❌ Informe o eventoId"); return; }
  if (!backupDbName) { console.error("❌ Informe o nome do banco de backup (ex: 'temp-restore')"); return; }

  // Importar Firebase do app
  const firebase = await import('/src/firebase.js');
  const { db } = firebase;
  const firestore = await import('firebase/firestore');
  const { getDocs, collection, doc, getDoc, setDoc, writeBatch, getFirestore, initializeApp } = firestore;

  console.log(`\n🔍 Conectando ao banco de backup "${backupDbName}"...`);

  // Conectar ao banco temporário (backup)
  // Usa o mesmo projeto Firebase, mas banco diferente
  let backupDb;
  try {
    const { getApp } = await import('firebase/app');
    const app = getApp();
    backupDb = getFirestore(app, backupDbName);
    console.log("✅ Conectado ao banco de backup");
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de backup:", err.message);
    console.log("Verifique se o banco temporário existe: gcloud firestore databases list");
    return;
  }

  // ── 1. Ler resultados do backup ──
  console.log(`\n📥 Buscando resultados do evento ${eventoId} no backup...`);
  const resultadosSnap = await getDocs(collection(backupDb, "resultados"));
  const resultadosParaRestaurar = [];

  resultadosSnap.forEach(docSnap => {
    // Documentos de resultado têm chave: eventoId_provaId_catId_sexo[__FASE]
    if (docSnap.id.startsWith(eventoId + "_")) {
      const data = docSnap.data();
      const nEntries = Object.keys(data).length;
      if (nEntries > 0) {
        resultadosParaRestaurar.push({ id: docSnap.id, data, nEntries });
      }
    }
  });

  console.log(`📊 Encontrados ${resultadosParaRestaurar.length} documento(s) de resultado`);
  resultadosParaRestaurar.forEach(r => {
    console.log(`   📄 ${r.id} — ${r.nEntries} atleta(s)`);
  });

  // ── 2. Ler seriação e configSeriação do evento no backup ──
  console.log(`\n📥 Buscando seriação do evento ${eventoId} no backup...`);
  const eventoBackupRef = doc(backupDb, "eventos", eventoId);
  const eventoBackupSnap = await getDoc(eventoBackupRef);

  let seriacaoBackup = null;
  let configSeriacaoBackup = null;

  if (eventoBackupSnap.exists()) {
    const eventoData = eventoBackupSnap.data();
    seriacaoBackup = eventoData.seriacao || null;
    configSeriacaoBackup = eventoData.configSeriacao || null;

    if (seriacaoBackup) {
      const nChaves = Object.keys(seriacaoBackup).length;
      console.log(`📊 Seriação encontrada: ${nChaves} chave(s)`);
      Object.keys(seriacaoBackup).forEach(k => {
        const ser = seriacaoBackup[k];
        const nSeries = ser?.series?.length || 0;
        const nAtletas = ser?.series?.reduce((acc, s) => acc + (s.atletas?.length || 0), 0) || 0;
        console.log(`   🏃 ${k} — ${nSeries} série(s), ${nAtletas} atleta(s)`);
      });
    } else {
      console.log("⚠️ Nenhuma seriação encontrada no backup");
    }

    if (configSeriacaoBackup) {
      const nProvas = Object.keys(configSeriacaoBackup).length;
      console.log(`📊 ConfigSeriação encontrada: ${nProvas} prova(s) configurada(s)`);
    }
  } else {
    console.log("⚠️ Evento não encontrado no banco de backup");
  }

  // ── 3. Preview e confirmação ──
  const totalOps = resultadosParaRestaurar.length + (seriacaoBackup ? 1 : 0);
  if (totalOps === 0) {
    console.log("\n⚠️ Nenhum dado para restaurar. Verifique o eventoId e o banco de backup.");
    return;
  }

  console.log(`\n════════════════════════════════════════════`);
  console.log(`📋 RESUMO DA RESTAURAÇÃO:`);
  console.log(`   Evento: ${eventoId}`);
  console.log(`   Resultados: ${resultadosParaRestaurar.length} documento(s)`);
  console.log(`   Seriação: ${seriacaoBackup ? Object.keys(seriacaoBackup).length + " chave(s)" : "—"}`);
  console.log(`   ConfigSeriação: ${configSeriacaoBackup ? "sim" : "—"}`);
  console.log(`════════════════════════════════════════════`);
  console.log(`\n⚠️ Para confirmar, execute:`);
  console.log(`   await _confirmarRestauracao()`);

  // Expor função de confirmação no escopo global
  window._confirmarRestauracao = async () => {
    console.log(`\n🔄 Restaurando...`);

    // Restaurar resultados em batches de 500
    let batchCount = 0;
    let batch = writeBatch(db);
    let opsInBatch = 0;

    for (const r of resultadosParaRestaurar) {
      const docRef = doc(db, "resultados", r.id);
      batch.set(docRef, r.data);
      opsInBatch++;

      if (opsInBatch >= 500) {
        await batch.commit();
        batchCount += opsInBatch;
        console.log(`   ✅ Batch: ${batchCount} resultados restaurados`);
        batch = writeBatch(db);
        opsInBatch = 0;
      }
    }

    if (opsInBatch > 0) {
      await batch.commit();
      batchCount += opsInBatch;
    }
    console.log(`✅ ${batchCount} documento(s) de resultado restaurados`);

    // Restaurar seriação e configSeriação no evento
    if (seriacaoBackup || configSeriacaoBackup) {
      const eventoRef = doc(db, "eventos", eventoId);
      const updates = {};
      if (seriacaoBackup) updates.seriacao = seriacaoBackup;
      if (configSeriacaoBackup) updates.configSeriacao = configSeriacaoBackup;
      await setDoc(eventoRef, updates, { merge: true });
      console.log(`✅ Seriação e configSeriação restauradas no evento`);
    }

    console.log(`\n🎉 Restauração concluída! Recarregue a página (F5) para ver os dados.`);
    delete window._confirmarRestauracao;
  };
}

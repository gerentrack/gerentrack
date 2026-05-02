/**
 * Reordena os snapshots de classificação por equipes por totalPontos decrescente.
 *
 * Executar no console do browser com o app rodando (localhost:5173).
 * Cole este código no console e chame:
 *   await reordenarSnapshotEquipes("1773079174215")
 */
async function reordenarSnapshotEquipes(eventoId) {
  const firebase = await import('/src/firebase.js');
  const { db } = firebase;
  const { doc, getDoc, setDoc } = await import('firebase/firestore');

  const eventoRef = doc(db, "eventos", eventoId);
  const snap = await getDoc(eventoRef);
  if (!snap.exists()) { console.error("Evento não encontrado"); return; }

  const data = snap.data();
  const updates = {};

  // Reordenar cada snapshot
  ["snapshotClassifEquipes", "snapshotClassifEquipesM", "snapshotClassifEquipesF"].forEach(campo => {
    const snapshot = data[campo];
    if (!snapshot?.classificacao?.length) return;

    const antes = snapshot.classificacao.map((eq, i) => `  ${i+1}º ${eq.nome} — ${eq.totalPontos} pts`).join("\n");

    const ordenado = [...snapshot.classificacao].sort((a, b) => b.totalPontos - a.totalPontos);

    const depois = ordenado.map((eq, i) => `  ${i+1}º ${eq.nome} — ${eq.totalPontos} pts`).join("\n");

    console.log(`\n📋 ${campo}:`);
    console.log(`ANTES:\n${antes}`);
    console.log(`DEPOIS:\n${depois}`);

    updates[campo] = { ...snapshot, classificacao: ordenado };
  });

  if (Object.keys(updates).length === 0) {
    console.log("Nenhum snapshot encontrado para reordenar.");
    return;
  }

  console.log("\n⚠️  Para confirmar, execute: await _confirmarReordenacao()");

  window._confirmarReordenacao = async () => {
    await setDoc(eventoRef, updates, { merge: true });
    console.log("✅ Snapshots reordenados! Recarregue a página (F5).");
    delete window._confirmarReordenacao;
  };
}

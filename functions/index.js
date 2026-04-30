const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({ region: "southamerica-east1" });

/**
 * listOrphanAuthUsers — lista contas Firebase Auth que não existem em nenhuma coleção do Firestore.
 * Apenas o admin do sistema pode chamar esta função.
 */
exports.listOrphanAuthUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Autenticação necessária.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  const snap = await admin.firestore().doc("config/admin").get();
  const adminEmail = (snap.exists ? snap.data()?.email || "" : "").toLowerCase().trim();
  if (!adminEmail || callerEmail !== adminEmail) {
    throw new HttpsError("permission-denied", "Apenas o administrador pode executar esta ação.");
  }

  // Coletar todos os emails do Firestore
  const emailsFirestore = new Set();

  const colecoes = ["organizadores", "equipes", "funcionarios", "treinadores", "atletasUsuarios"];
  const camposEmail = { equipes: ["email", "representanteEmail"] };

  for (const col of colecoes) {
    const snapshot = await admin.firestore().collection(col).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const campos = camposEmail[col] || ["email"];
      for (const campo of campos) {
        if (data[campo]) emailsFirestore.add(data[campo].toLowerCase().trim());
      }
    }
  }

  // Também incluir o email do admin
  if (adminEmail) emailsFirestore.add(adminEmail);

  // Listar todos os usuários do Auth
  const orphans = [];
  let nextPageToken;
  do {
    const listResult = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of listResult.users) {
      const email = (user.email || "").toLowerCase().trim();
      if (email && !emailsFirestore.has(email)) {
        orphans.push({
          uid: user.uid,
          email: user.email,
          criadoEm: user.metadata.creationTime || null,
          ultimoLogin: user.metadata.lastSignInTime || null,
        });
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  return { orphans, totalAuth: emailsFirestore.size + orphans.length, totalFirestore: emailsFirestore.size };
});

/**
 * deleteAuthUser — deleta uma conta Firebase Auth pelo email.
 * Apenas o admin do sistema pode chamar esta função.
 */
exports.deleteAuthUser = onCall(async (request) => {
  // Requer autenticação
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Autenticação necessária.");
  }

  // Verificar se o caller é admin lendo config/admin do Firestore
  const callerEmail = (request.auth.token.email || "").toLowerCase();
  const snap = await admin.firestore().doc("config/admin").get();
  const adminEmail = (snap.exists ? snap.data()?.email || "" : "").toLowerCase().trim();
  if (!adminEmail || callerEmail !== adminEmail) {
    throw new HttpsError("permission-denied", "Apenas o administrador pode executar esta ação.");
  }

  const email = request.data?.email;
  if (!email || typeof email !== "string") {
    throw new HttpsError("invalid-argument", "Email é obrigatório.");
  }

  try {
    const user = await admin.auth().getUserByEmail(email.trim());
    await admin.auth().deleteUser(user.uid);
    return { success: true };
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return { success: true, message: "Conta não encontrada (já removida)." };
    }
    throw new HttpsError("internal", `Erro ao deletar conta: ${err.message}`);
  }
});

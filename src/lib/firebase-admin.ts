import admin from "firebase-admin";

// Inicializar Firebase Admin SDK apenas uma vez
if (!admin.apps.length) {
  try {
    // Se estiver em produção, use service account key
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
    // Para desenvolvimento local, você pode usar a emulação ou chave de serviço
    else if (process.env.NODE_ENV === "development") {
      // Em desenvolvimento, você pode configurar as credenciais manualmente
      // ou usar o Firebase emulator
      console.warn("Firebase Admin não configurado para desenvolvimento");
    }
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;

export default admin;

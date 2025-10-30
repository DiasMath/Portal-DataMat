import admin from 'firebase-admin';

// ✅ Verificar se variáveis existem antes de inicializar
const initializeFirebaseAdmin = () => {
  // Se já está inicializado, retornar
  if (admin.apps.length > 0) {
    return {
      adminAuth: admin.auth(),
      adminDb: admin.firestore()
    };
  }

  // Verificar se variáveis existem
  if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    console.warn('⚠️ Firebase Admin credentials not found');
    return {
      adminAuth: null,
      adminDb: null
    };
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });

    return {
      adminAuth: admin.auth(),
      adminDb: admin.firestore()
    };
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    return {
      adminAuth: null,
      adminDb: null
    };
  }
};

const { adminAuth, adminDb } = initializeFirebaseAdmin();

export { adminAuth, adminDb };
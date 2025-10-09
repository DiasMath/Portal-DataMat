import { NextResponse, type NextRequest } from "next/server";

// Explicitamente setamos o runtime para Node.js como uma medida de segurança.
export const runtime = 'nodejs';

/**
 * Valida a sessão do chamador e verifica se ele é um master_admin.
 * Usa import dinâmico para compatibilidade com Turbopack.
 */
async function validateMasterAdmin(session: string | undefined) {
  if (!session) return null;
  try {
    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    if (!adminAuth || !adminDb) return null;

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    if (!decodedToken) return null;

    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (userDoc?.exists && userDoc.data()?.role === 'master_admin') {
      return decodedToken.uid;
    }
    return null;
  } catch (error) {
    console.error("Erro ao validar master_admin:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  const masterAdminUid = await validateMasterAdmin(session);
  if (!masterAdminUid) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const { uid: uidToDelete } = await request.json();

  if (!uidToDelete || typeof uidToDelete !== 'string') {
    return NextResponse.json({ error: "UID do usuário não fornecido ou inválido." }, { status: 400 });
  }

  if (uidToDelete === masterAdminUid) {
    return NextResponse.json({ error: "Um administrador não pode se auto-excluir." }, { status: 400 });
  }

  try {
    // Import dinâmico para evitar problemas com o bundler
    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    if (!adminAuth || !adminDb) {
        throw new Error("Conexão com o Firebase Admin não disponível.");
    }

    // Executa a exclusão na Auth e no Firestore
    await adminAuth.deleteUser(uidToDelete);
    await adminDb.collection('users').doc(uidToDelete).delete();

    console.log(`Usuário ${uidToDelete} excluído com sucesso pelo admin ${masterAdminUid}`);
    return NextResponse.json({ success: true, message: `Usuário ${uidToDelete} excluído com sucesso.` });

  } catch (error: any) {
    console.error(`Falha ao excluir usuário ${uidToDelete}:`, error);
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: "Usuário não encontrado na autenticação do Firebase." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro interno do servidor ao excluir usuário." }, { status: 500 });
  }
}

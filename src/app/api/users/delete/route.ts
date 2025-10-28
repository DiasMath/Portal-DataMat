import { NextResponse, type NextRequest } from "next/server";
import { validateMasterAdmin } from "@/lib/auth-helpers";

// Explicitamente setamos o runtime para Node.js como uma medida de segurança.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Validar autenticação e permissões
  const currentUser = await validateMasterAdmin(request);
  
  if (!currentUser) {
    return NextResponse.json({ 
      error: "Acesso negado. Apenas master admins podem excluir usuários." 
    }, { status: 403 });
  }

  const { uid: uidToDelete } = await request.json();

  if (!uidToDelete || typeof uidToDelete !== 'string') {
    return NextResponse.json({ error: "UID do usuário não fornecido ou inválido." }, { status: 400 });
  }

  if (uidToDelete === currentUser.uid) {
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

    console.log(`Usuário ${uidToDelete} excluído com sucesso pelo admin ${currentUser.uid}`);
    return NextResponse.json({ success: true, message: `Usuário ${uidToDelete} excluído com sucesso.` });

  } catch (error: any) {
    console.error(`Falha ao excluir usuário ${uidToDelete}:`, error);
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: "Usuário não encontrado na autenticação do Firebase." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro interno do servidor ao excluir usuário." }, { status: 500 });
  }
}

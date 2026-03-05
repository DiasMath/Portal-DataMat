import { NextResponse, type NextRequest } from "next/server";
import { validateMasterAdmin } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

// Explicitamente setamos o runtime para Node.js como uma medida de segurança.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Validar autenticação e permissões
  const currentUser = await validateMasterAdmin(request);

  if (!currentUser) {
    return NextResponse.json(
      {
        error: "Acesso negado. Apenas master admins podem excluir usuários.",
      },
      { status: 403 },
    );
  }

  const { uid: uidToDelete } = await request.json();

  if (!uidToDelete || typeof uidToDelete !== "string") {
    return NextResponse.json(
      { error: "UID do usuário não fornecido ou inválido." },
      { status: 400 },
    );
  }

  if (uidToDelete === currentUser.uid) {
    return NextResponse.json(
      { error: "Um administrador não pode se auto-excluir." },
      { status: 400 },
    );
  }

  try {
    // Import dinâmico para evitar problemas com o bundler
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    if (!adminAuth || !adminDb) {
      throw new Error("Conexão com o Firebase Admin não disponível.");
    }

    // Revogar sessões do usuário antes da exclusão
    await adminAuth.revokeRefreshTokens(uidToDelete);

    // Executa a exclusão na Auth e no Firestore
    await adminAuth.deleteUser(uidToDelete);
    await adminDb.collection("users").doc(uidToDelete).delete();

    await logAuditEvent({
      action: "USER_DELETE",
      actorUid: currentUser.uid,
      targetType: "user",
      targetId: uidToDelete,
    });

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso.",
    });
  } catch (error: unknown) {
    console.error(`Falha ao excluir usuário ${uidToDelete}:`, error);
    const firebaseError = error as { code?: string };
    if (firebaseError.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Usuário não encontrado na autenticação." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir usuário." },
      { status: 500 },
    );
  }
}


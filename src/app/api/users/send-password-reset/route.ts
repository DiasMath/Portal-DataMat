import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autorização necessário" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verificar se o Firebase Admin está configurado
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error:
            "Firebase Admin não configurado. Configure a chave de serviço.",
        },
        { status: 500 }
      );
    }

    // Verificar o token do usuário
    const decodedToken = await adminAuth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    // Verificar se o usuário atual é master_admin
    const currentUserDoc = await adminDb
      .collection("users")
      .doc(currentUserId)
      .get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData || currentUserData.role !== "master_admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas master admins podem criar usuários." },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Gerar link de reset
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });

    return NextResponse.json({
      success: true,
      message: "Link de redefinição gerado",
      resetLink, // Você pode enviar por email ou mostrar ao admin
    });
  } catch (error: any) {
    console.error("Erro ao gerar link de reset:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao gerar link de reset" },
      { status: 500 }
    );
  }
}

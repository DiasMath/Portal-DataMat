import { adminAuth } from "@/lib/firebase-admin";
import { validateMasterAdmin } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const currentUser = await validateMasterAdmin(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas master admins podem redefinir senhas." },
        { status: 403 }
      );
    }

    // Verificar se o Firebase Admin está configurado
    if (!adminAuth) {
      return NextResponse.json(
        {
          error:
            "Firebase Admin não configurado. Configure a chave de serviço.",
        },
        { status: 500 }
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

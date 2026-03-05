import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const isDev = process.env.NODE_ENV !== "production";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateEntry = { count: number; windowStart: number };
const rateLimitStore = new Map<string, RateEntry>();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Reinicia janela
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  rateLimitStore.set(key, entry);
  return false;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      if (isDev) {
        console.log("[check-email] Email não fornecido");
      }
      return NextResponse.json(
        { error: "Email é obrigatório", exists: false },
        { status: 400 },
      );
    }

    const ip =
      (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    const rateKey = `${ip}::${email.toLowerCase()}`;

    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        {
          error:
            "Muitas tentativas em pouco tempo. Aguarde um momento antes de tentar novamente.",
          exists: false,
        },
        { status: 429 },
      );
    }

    if (isDev) {
      console.log("[check-email] Verificando email:", email);
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin não está configurado", exists: false },
        { status: 500 },
      );
    }

    // Buscar usuário no Firestore pelo email
    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      if (isDev) {
        console.log("[check-email] Usuário não encontrado:", email);
      }
      // Mantemos 404 para o fluxo atual, mas com mensagem genérica
      return NextResponse.json(
        {
          exists: false,
          message: "Usuário não encontrado ou não autorizado no sistema.",
        },
        { status: 404 },
      );
    }

    const userData = snapshot.docs[0].data();
    if (isDev) {
      console.log(
        "[check-email] Usuário encontrado:",
        email,
        "authorized:",
        userData?.authorized,
      );
    }

    return NextResponse.json({
      exists: true,
      authorized: userData?.authorized || false,
      role: userData?.role || "user",
    });
  } catch (error) {
    console.error("[check-email] Erro ao verificar email:", error);
    return NextResponse.json(
      { error: "Erro ao verificar email", exists: false },
      { status: 500 },
    );
  }
}


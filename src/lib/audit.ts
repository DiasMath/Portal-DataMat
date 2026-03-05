import type { firestore } from "firebase-admin";
import admin from "@/lib/firebase-admin";

type AuditAction =
  | "USER_CREATE"
  | "USER_DELETE"
  | "USER_ROLE_UPDATE"
  | "USER_AUTHZ_UPDATE"
  | "COMPANY_CREATE"
  | "COMPANY_UPDATE"
  | "COMPANY_DELETE"
  | "DASHBOARD_CREATE"
  | "DASHBOARD_UPDATE"
  | "DASHBOARD_DELETE";

interface AuditLogEntry {
  action: AuditAction;
  actorUid: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt: firestore.FieldValue;
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, "createdAt">) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");

    if (!adminDb) {
      return;
    }

    const payload: AuditLogEntry = {
      ...entry,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection("auditLogs").add(payload);
  } catch (error) {
    // Intencionalmente não quebra a requisição principal.
    console.error("[audit] Erro ao registrar evento de auditoria:", error);
  }
}


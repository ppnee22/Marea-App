import { DocumentCategory, ExpenseCategory, Platform, PropertyType } from "@prisma/client";

export const PLATFORM_LABELS: Record<Platform, string> = {
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  SHORT_TERM: "Affitto breve",
  MONTHLY: "Affitto mensile",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MANUTENZIONE: "Manutenzione",
  RIPARAZIONI: "Riparazioni",
  CONDOMINIO_ORDINARIA: "Condominio (ordinaria)",
  CONDOMINIO_RISCALDAMENTO: "Condominio (riscaldamento)",
  IMU: "IMU",
  LUCE: "Luce",
  ACQUA: "Acqua",
  GAS: "Gas",
  INTERNET: "Internet",
  ALTRO: "Altre spese",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  CONTRATTO: "Contratto",
  FATTURA: "Fattura",
  RICEVUTA: "Ricevuta",
  FISCALE: "Documento fiscale",
  CONDOMINIALE: "Documento condominiale",
  MANUTENZIONE: "Documento manutenzione",
  SCREENSHOT_PRENOTAZIONE: "Screenshot prenotazione",
  ALTRO: "Altro documento",
};

export function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

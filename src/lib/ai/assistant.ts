"use server";

import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { requireAuth } from "@/lib/actions/guard";
import { prisma } from "@/lib/prisma";
import { bookingNetProfit, sumBy, toNumber } from "@/lib/calc";
import { EXPENSE_CATEGORY_LABELS, PLATFORM_LABELS } from "@/lib/labels";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Costruisce un riepilogo compatto di tutti i dati gestionali da passare all'IA come contesto. */
async function buildDataSnapshot() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(currentYear, 0, 1));
  const yearEnd = new Date(Date.UTC(currentYear + 1, 0, 1));

  const [properties, bookings, expenses, monthlyPayments] = await Promise.all([
    prisma.property.findMany(),
    prisma.booking.findMany({ where: { checkIn: { gte: yearStart, lt: yearEnd } } }),
    prisma.expense.findMany({ where: { date: { gte: yearStart, lt: yearEnd } }, include: { property: true } }),
    prisma.monthlyPayment.findMany({ where: { year: currentYear }, include: { property: true } }),
  ]);

  const propertyById = new Map(properties.map((p) => [p.id, p]));

  const bookingsSummary = bookings.map((b) => {
    const property = propertyById.get(b.propertyId);
    return {
      appartamento: property?.name ?? b.propertyId,
      cliente: b.guestName,
      piattaforma: PLATFORM_LABELS[b.platform],
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      incassato: toNumber(b.amountPaid),
      guadagnoNetto: bookingNetProfit(b),
    };
  });

  const expensesByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const label = EXPENSE_CATEGORY_LABELS[e.category];
    expensesByCategory[label] = (expensesByCategory[label] ?? 0) + toNumber(e.amount);
  }

  const expensesByProperty: Record<string, number> = {};
  for (const e of expenses) {
    const name = e.property?.name ?? "N/D";
    expensesByProperty[name] = (expensesByProperty[name] ?? 0) + toNumber(e.amount);
  }

  const incomeByPlatform: Record<string, number> = {};
  for (const b of bookings) {
    const label = PLATFORM_LABELS[b.platform];
    incomeByPlatform[label] = (incomeByPlatform[label] ?? 0) + bookingNetProfit(b);
  }

  const unpaidMonthly = monthlyPayments
    .filter((p) => !p.isPaid)
    .map((p) => ({
      appartamento: p.property.name,
      mese: p.month,
      anno: p.year,
      importoDovuto: toNumber(p.amountDue),
    }));

  const monthlyPaidTotal = sumBy(
    monthlyPayments.filter((p) => p.isPaid),
    (p) => p.amountPaid ?? p.amountDue
  );

  return {
    anno: currentYear,
    appartamenti: properties.map((p) => ({
      nome: p.name,
      tipo: p.type === "SHORT_TERM" ? "Affitto breve (mare)" : "Affitto mensile",
      inquilino: p.tenantName,
      affittoMensile: p.monthlyRent ? toNumber(p.monthlyRent) : null,
    })),
    prenotazioniAnnoCorrente: bookingsSummary,
    guadagnoNettoPerPiattaforma: incomeByPlatform,
    speseAnnoCorrentePerCategoria: expensesByCategory,
    speseAnnoCorrentePerAppartamento: expensesByProperty,
    pagamentiMensiliNonPagati: unpaidMonthly,
    totaleAffittiMensiliIncassatiAnno: monthlyPaidTotal,
  };
}

const SYSTEM_PROMPT = `Sei l'assistente IA di "Marea", un gestionale personale per appartamenti in affitto (uno al mare con affitti brevi su Booking/Airbnb, altri in affitto mensile).
Rispondi in italiano, in modo conciso e concreto, basandoti ESCLUSIVAMENTE sui dati JSON forniti nel contesto (relativi all'anno corrente, salvo diversamente specificato dall'utente).
Se una domanda richiede dati che non sono nel contesto fornito, dillo chiaramente invece di inventare numeri.
Usa il simbolo € e formatta i numeri in modo leggibile (es. 1.250,00 €).`;

export async function askAssistant(history: ChatMessage[]): Promise<string> {
  await requireAuth();

  const anthropic = getAnthropicClient();
  const snapshot = await buildDataSnapshot();

  const contextMessage = `Dati gestionali aggiornati (anno ${snapshot.anno}):\n${JSON.stringify(snapshot, null, 2)}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: contextMessage },
      { role: "assistant", content: "Ho ricevuto i dati aggiornati, sono pronto a rispondere." },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "Non sono riuscito a generare una risposta.";
}

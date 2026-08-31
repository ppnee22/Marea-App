"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import { requireAuth } from "@/lib/actions/guard";

export interface ExtractedBookingData {
  guestName: string | null;
  platform: "BOOKING" | "AIRBNB" | null;
  checkIn: string | null; // YYYY-MM-DD
  checkOut: string | null; // YYYY-MM-DD
  amountPaid: number | null;
  platformCommission: number | null;
  taxes: number | null;
  notes: string | null;
  confidence: "alta" | "media" | "bassa";
}

const SYSTEM_PROMPT = `Sei un assistente che estrae dati strutturati da screenshot di prenotazioni di Booking.com o Airbnb.
Analizza l'immagine (o le immagini, che potrebbero essere due schermate della stessa prenotazione) ed estrai:
- guestName: nome e cognome del cliente
- platform: "BOOKING" se è Booking.com, "AIRBNB" se è Airbnb, altrimenti null
- checkIn: data di check-in in formato YYYY-MM-DD
- checkOut: data di check-out in formato YYYY-MM-DD
- amountPaid: importo totale pagato/guadagnato dal cliente (numero, senza simbolo di valuta)
- platformCommission: eventuale commissione della piattaforma se visibile (numero), altrimenti null
- taxes: eventuali tasse indicate se visibili (numero), altrimenti null
- notes: eventuali altre informazioni utili visibili (es. numero ospiti, codice prenotazione)
- confidence: "alta", "media" o "bassa" in base a quanto sei sicuro dei dati estratti

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con queste chiavi, nessun altro testo.
Se un dato non è presente o leggibile nell'immagine, usa null per quel campo.`;

export async function extractBookingFromScreenshots(files: File[]): Promise<ExtractedBookingData> {
  await requireAuth();

  if (files.length === 0) {
    throw new Error("Carica almeno uno screenshot");
  }
  if (files.length > 2) {
    throw new Error("Puoi caricare al massimo 2 screenshot per prenotazione");
  }

  const images = await Promise.all(
    files.map(async (file) => ({
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mimeType: file.type || "image/jpeg",
    }))
  );

  const anthropic = getAnthropicClient();

  const content: Anthropic.MessageParam["content"] = [
    ...images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
        data: img.base64,
      },
    })),
    {
      type: "text" as const,
      text: "Estrai i dati della prenotazione da questi screenshot e rispondi solo con il JSON richiesto.",
    },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Nessuna risposta valida dall'IA");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Impossibile interpretare la risposta dell'IA");
  }

  return JSON.parse(jsonMatch[0]) as ExtractedBookingData;
}

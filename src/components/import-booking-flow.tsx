"use client";

import { useState } from "react";
import { extractBookingFromScreenshots, ExtractedBookingData } from "@/lib/ai/ocr";
import { createBookingFromImport } from "@/lib/actions/bookings";
import { BookingForm, PlatformRates } from "@/components/booking-form";
import { Button, Card } from "@/components/ui/primitives";

export function ImportBookingFlow({ propertyId, rates }: { propertyId: string; rates: PlatformRates }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedBookingData | null>(null);

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList).slice(0, 2);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    setExtracted(null);
    setError(null);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await extractBookingFromScreenshots(files);
      setExtracted(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante l'analisi dell'immagine");
    } finally {
      setLoading(false);
    }
  }

  if (!extracted) {
    return (
      <Card className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Screenshot della prenotazione (max 2 foto)</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFilesSelected(e.target.files)}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
          />
        </div>

        {previews.length > 0 ? (
          <div className="flex gap-3">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`Screenshot ${i + 1}`} className="h-40 w-32 rounded-lg border border-slate-200 object-cover" />
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="button" disabled={files.length === 0 || loading} onClick={analyze}>
          {loading ? "Analisi in corso..." : "✨ Analizza con IA"}
        </Button>
      </Card>
    );
  }

  const confidenceColor =
    extracted.confidence === "alta" ? "text-emerald-700" : extracted.confidence === "media" ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Dati riconosciuti dall&apos;IA — affidabilità:{" "}
            <span className={`font-semibold ${confidenceColor}`}>{extracted.confidence}</span>
          </p>
          <button
            type="button"
            className="text-xs text-slate-500 underline"
            onClick={() => {
              setExtracted(null);
            }}
          >
            Ricarica screenshot
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Controlla e correggi i dati prima di salvare: l&apos;IA può commettere errori di lettura.
        </p>
        <div className="mt-3 flex gap-3">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Screenshot ${i + 1}`} className="h-28 w-24 rounded-lg border border-slate-200 object-cover" />
          ))}
        </div>
      </Card>

      <Card>
        <BookingForm
          propertyId={propertyId}
          rates={rates}
          submitLabel="Conferma e salva prenotazione"
          autoCalcDefault={extracted.platformCommission === null && extracted.taxes === null}
          initial={{
            guestName: extracted.guestName ?? "",
            platform: extracted.platform ?? "BOOKING",
            checkIn: extracted.checkIn ?? "",
            checkOut: extracted.checkOut ?? "",
            amountPaid: extracted.amountPaid !== null ? String(extracted.amountPaid) : "",
            platformCommission: extracted.platformCommission !== null ? String(extracted.platformCommission) : "0",
            taxes: extracted.taxes !== null ? String(extracted.taxes) : "0",
            otherDeductions: "0",
            notes: extracted.notes ?? "",
          }}
          action={async (formData) => {
            files.forEach((file) => formData.append("screenshots", file));
            await createBookingFromImport(formData);
          }}
        />
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { extractBookingFromScreenshots, ExtractedBookingData } from "@/lib/ai/ocr";
import { createBookingFromImport } from "@/lib/actions/bookings";
import { compressImageFile } from "@/lib/image-compress";
import { BookingForm, PlatformRates } from "@/components/booking-form";
import { Button, Card } from "@/components/ui/primitives";

/** createBookingFromImport reindirizza (throw interno di Next.js) quando va a buon fine: va sempre rilanciato. */
function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function ImportBookingFlow({
  propertyId,
  rates,
  cityTaxRate = 0,
}: {
  propertyId: string;
  rates: PlatformRates;
  cityTaxRate?: number;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedBookingData | null>(null);

  async function onFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList).slice(0, 2);
    setExtracted(null);
    setError(null);
    setCompressing(true);
    try {
      const compressed = await Promise.all(selected.map((f) => compressImageFile(f)));
      setFiles(compressed);
      setPreviews(compressed.map((f) => URL.createObjectURL(f)));
    } finally {
      setCompressing(false);
    }
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

        <Button type="button" disabled={files.length === 0 || loading || compressing} onClick={analyze}>
          {compressing ? "Preparazione foto..." : loading ? "Analisi in corso..." : "✨ Analizza con IA"}
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

      {saveError ? (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{saveError}</p>
        </Card>
      ) : null}

      <Card>
        <BookingForm
          propertyId={propertyId}
          rates={rates}
          cityTaxRate={cityTaxRate}
          submitLabel={saving ? "Salvataggio..." : "Conferma e salva prenotazione"}
          autoCalcDefault={extracted.platformCommission === null && extracted.taxes === null}
          initial={{
            guestName: extracted.guestName ?? "",
            guests: extracted.guests !== null ? String(extracted.guests) : "1",
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
            setSaving(true);
            setSaveError(null);
            try {
              files.forEach((file) => formData.append("screenshots", file));
              await createBookingFromImport(formData);
            } catch (e) {
              if (isNextRedirectError(e)) throw e;
              setSaveError(e instanceof Error ? e.message : "Errore durante il salvataggio della prenotazione");
              setSaving(false);
            }
          }}
        />
      </Card>
    </div>
  );
}

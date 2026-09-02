"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { DOCUMENT_CATEGORY_LABELS, enumOptions } from "@/lib/labels";
import { uploadDocument } from "@/lib/actions/documents";
import { compressImageFile } from "@/lib/image-compress";
import { DocumentCategory } from "@prisma/client";

const CATEGORY_OPTIONS = enumOptions(DOCUMENT_CATEGORY_LABELS);

export function DocumentUploadForm({
  propertyId,
  bookingId,
  defaultCategory,
  properties,
}: {
  propertyId?: string;
  bookingId?: string;
  defaultCategory?: DocumentCategory;
  properties?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
        + Carica documento
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        try {
          const file = formData.get("file");
          if (file instanceof File && file.size > 0) {
            formData.set("file", await compressImageFile(file));
          }
          await uploadDocument(formData);
          setOpen(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Errore durante il caricamento");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-3 rounded-xl border border-slate-200 p-4"
    >
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {bookingId ? <input type="hidden" name="bookingId" value={bookingId} /> : null}

      {!propertyId && properties ? (
        <Field label="Appartamento">
          <Select name="propertyId" defaultValue="">
            <option value="">Documento generale (nessun appartamento)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Categoria">
        <Select name="category" required defaultValue={defaultCategory ?? ""}>
          <option value="" disabled>
            Seleziona...
          </option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="File">
        <input
          type="file"
          name="file"
          required
          accept="image/*,application/pdf"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
        />
      </Field>
      <Field label="Note (opzionale)">
        <Input type="text" name="notes" />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Caricamento..." : "Carica"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

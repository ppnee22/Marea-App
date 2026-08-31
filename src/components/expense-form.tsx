"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { EXPENSE_CATEGORY_LABELS, enumOptions } from "@/lib/labels";
import { createExpense } from "@/lib/actions/expenses";

const CATEGORY_OPTIONS = enumOptions(EXPENSE_CATEGORY_LABELS);

export function ExpenseForm({
  propertyId,
  bookingId,
  properties,
  onDone,
}: {
  propertyId?: string;
  bookingId?: string;
  properties?: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} type="button">
        + Aggiungi spesa
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createExpense(formData);
        setOpen(false);
        onDone?.();
      }}
      className="space-y-3 rounded-xl border border-slate-200 p-4"
    >
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      {bookingId ? <input type="hidden" name="bookingId" value={bookingId} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {!propertyId && properties ? (
          <Field label="Appartamento">
            <Select name="propertyId" required defaultValue="">
              <option value="" disabled>
                Seleziona...
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Categoria">
          <Select name="category" required defaultValue="">
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
        <Field label="Importo (€)">
          <Input type="text" inputMode="decimal" name="amount" required />
        </Field>
        <Field label="Data">
          <Input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Descrizione">
          <Input type="text" name="description" />
        </Field>
      </div>
      <Field label="Note">
        <Textarea name="notes" rows={2} />
      </Field>
      <Field label="Allegato (foto o documento, opzionale)">
        <input
          type="file"
          name="attachment"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
        />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Salva spesa
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

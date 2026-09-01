"use client";

import { useState } from "react";
import { ExpenseCategory } from "@prisma/client";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS, enumOptions } from "@/lib/labels";
import { deleteExpense, updateExpense } from "@/lib/actions/expenses";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";

const CATEGORY_OPTIONS = enumOptions(EXPENSE_CATEGORY_LABELS);

/** Forma serializzabile di una spesa: gli importi Decimal di Prisma vanno convertiti in number prima di passarli a un Client Component. */
export interface ExpenseListItem {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: Date | string;
  description: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  property?: { name: string };
}

function ExpenseRow({ expense }: { expense: ExpenseListItem }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-3">
        <form
          action={async (formData) => {
            await updateExpense(expense.id, formData);
            setEditing(false);
          }}
          className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoria">
              <Select name="category" required defaultValue={expense.category}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Importo (€)">
              <Input type="text" inputMode="decimal" name="amount" required defaultValue={String(expense.amount)} />
            </Field>
            <Field label="Data">
              <Input type="date" name="date" required defaultValue={toDateInputValue(expense.date)} />
            </Field>
            <Field label="Descrizione">
              <Input type="text" name="description" defaultValue={expense.description ?? ""} />
            </Field>
          </div>
          <Field label="Note">
            <Textarea name="notes" rows={2} defaultValue={expense.notes ?? ""} />
          </Field>
          <Field label={expense.attachmentUrl ? "Sostituisci allegato (opzionale)" : "Allegato (opzionale)"}>
            <input
              type="file"
              name="attachment"
              accept="image/*,application/pdf"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Salva modifiche
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Annulla
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
          {expense.property ? <span className="font-medium text-slate-800">{expense.property.name}</span> : null}
          <span className="text-slate-500">{formatDate(expense.date)}</span>
        </div>
        {expense.description ? <p className="mt-0.5 truncate text-slate-700">{expense.description}</p> : null}
        {expense.attachmentUrl ? (
          <a href={expense.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-700 hover:underline">
            Vedi allegato
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-medium text-red-600">-{formatCurrency(expense.amount)}</span>
        <button type="button" onClick={() => setEditing(true)} className="text-slate-400 hover:text-teal-700" aria-label="Modifica spesa">
          ✎
        </button>
        <form action={deleteExpense.bind(null, expense.id, undefined)}>
          <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Elimina spesa">
            ✕
          </button>
        </form>
      </div>
    </li>
  );
}

export function ExpenseList({ expenses }: { expenses: ExpenseListItem[] }) {
  if (expenses.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna spesa registrata.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {expenses.map((e) => (
        <ExpenseRow key={e.id} expense={e} />
      ))}
    </ul>
  );
}

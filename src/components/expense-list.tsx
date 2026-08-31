import { Expense } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/labels";
import { deleteExpense } from "@/lib/actions/expenses";
import { Badge } from "@/components/ui/primitives";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna spesa registrata.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {expenses.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge>{EXPENSE_CATEGORY_LABELS[e.category]}</Badge>
              <span className="text-slate-500">{formatDate(e.date)}</span>
            </div>
            {e.description ? <p className="mt-0.5 truncate text-slate-700">{e.description}</p> : null}
            {e.attachmentUrl ? (
              <a href={e.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-700 hover:underline">
                Vedi allegato
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-medium text-red-600">-{formatCurrency(Number(e.amount))}</span>
            <form action={deleteExpense.bind(null, e.id, undefined)}>
              <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Elimina spesa">
                ✕
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAllProperties } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { sumBy } from "@/lib/calc";
import { EXPENSE_CATEGORY_LABELS, enumOptions } from "@/lib/labels";
import { ExpenseCategory } from "@prisma/client";
import { Badge, Card, StatCard } from "@/components/ui/primitives";
import { ExpenseForm } from "@/components/expense-form";
import { deleteExpense } from "@/lib/actions/expenses";

const CATEGORY_OPTIONS = enumOptions(EXPENSE_CATEGORY_LABELS);

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; category?: string; year?: string }>;
}) {
  const params = await searchParams;
  const properties = await getAllProperties();
  const currentYear = new Date().getUTCFullYear();
  const year = params.year ? Number(params.year) : currentYear;

  const category = CATEGORY_OPTIONS.some((o) => o.value === params.category) ? (params.category as ExpenseCategory) : undefined;

  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      ...(category ? { category } : {}),
    },
    include: { property: true },
    orderBy: { date: "desc" },
  });

  const total = sumBy(expenses, (e) => e.amount);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function withParam(key: string, value: string) {
    const p = new URLSearchParams();
    if (params.propertyId) p.set("propertyId", params.propertyId);
    if (params.category) p.set("category", params.category);
    if (params.year) p.set("year", params.year);
    if (value) p.set(key, value);
    else p.delete(key);
    return `/spese?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Spese e manutenzione</h1>
          <p className="mt-1 text-sm text-slate-500">Registro generale di tutte le spese</p>
        </div>
        <ExpenseForm properties={properties.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <StatCard label={`Totale spese ${year}`} value={formatCurrency(total)} color="red" />

      <div className="flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={withParam("year", String(y))}
            className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={withParam("propertyId", "")}
          className={`rounded-full px-3 py-1 text-xs ${!params.propertyId ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Tutti gli appartamenti
        </Link>
        {properties.map((p) => (
          <Link
            key={p.id}
            href={withParam("propertyId", p.id)}
            className={`rounded-full px-3 py-1 text-xs ${params.propertyId === p.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={withParam("category", "")}
          className={`rounded-full px-3 py-1 text-xs ${!category ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Tutte le categorie
        </Link>
        {CATEGORY_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={withParam("category", opt.value)}
            className={`rounded-full px-3 py-1 text-xs ${category === opt.value ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <Card>
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuna spesa trovata con i filtri selezionati.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{EXPENSE_CATEGORY_LABELS[e.category]}</Badge>
                    <span className="font-medium text-slate-800">{e.property.name}</span>
                    <span className="text-slate-400">{formatDate(e.date)}</span>
                  </div>
                  {e.description ? <p className="mt-0.5 truncate text-slate-600">{e.description}</p> : null}
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
        )}
      </Card>
    </div>
  );
}

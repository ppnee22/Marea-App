import { MonthlyPayment } from "@prisma/client";
import { updateMonthlyPayment } from "@/lib/actions/monthly-payments";
import { MONTH_NAMES_IT, toNumber } from "@/lib/calc";
import { formatCurrency, toDateInputValue } from "@/lib/format";
import { Badge } from "@/components/ui/primitives";

export function MonthlyPaymentsTable({ payments }: { payments: MonthlyPayment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="py-2 pr-2">Mese</th>
            <th className="py-2 pr-2">Pagato</th>
            <th className="py-2 pr-2">Data pagamento</th>
            <th className="py-2 pr-2">Importo dovuto</th>
            <th className="py-2 pr-2">Importo pagato</th>
            <th className="py-2 pr-2">Mancante</th>
            <th className="py-2 pr-2">Note</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const formId = `payment-form-${p.id}`;
            const due = toNumber(p.amountDue);
            const paid = p.amountPaid !== null ? toNumber(p.amountPaid) : p.isPaid ? due : 0;
            const missing = p.isPaid ? Math.max(due - paid, 0) : due;

            return (
              <tr key={p.id} className="border-b border-slate-100 align-middle">
                <td className="py-2 pr-2 font-medium text-slate-800">{MONTH_NAMES_IT[p.month - 1]}</td>
                <td className="py-2 pr-2">
                  <form id={formId} action={updateMonthlyPayment.bind(null, p.id)} className="contents" />
                  <input type="checkbox" name="isPaid" form={formId} defaultChecked={p.isPaid} className="h-4 w-4" />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="date"
                    name="paidDate"
                    form={formId}
                    defaultValue={toDateInputValue(p.paidDate)}
                    className="w-36 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    name="amountDue"
                    form={formId}
                    defaultValue={String(due)}
                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    name="amountPaid"
                    form={formId}
                    defaultValue={p.amountPaid !== null ? String(paid) : ""}
                    placeholder="—"
                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </td>
                <td className="py-2 pr-2">
                  {missing > 0 ? <Badge color="red">{formatCurrency(missing)}</Badge> : <Badge color="green">—</Badge>}
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="text"
                    name="notes"
                    form={formId}
                    defaultValue={p.notes ?? ""}
                    className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </td>
                <td className="py-2">
                  <button
                    type="submit"
                    form={formId}
                    className="rounded-md bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    Salva
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

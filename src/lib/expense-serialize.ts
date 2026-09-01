import { Expense, Property } from "@prisma/client";
import { toNumber } from "@/lib/calc";
import type { ExpenseListItem } from "@/components/expense-list";

/** Converte una spesa Prisma (con Decimal) in una forma semplice passabile a un Client Component. */
export function toExpenseListItem(expense: Expense & { property?: Pick<Property, "name"> }): ExpenseListItem {
  return {
    id: expense.id,
    category: expense.category,
    amount: toNumber(expense.amount),
    date: expense.date,
    description: expense.description,
    notes: expense.notes,
    attachmentUrl: expense.attachmentUrl,
    property: expense.property ? { name: expense.property.name } : undefined,
  };
}

export function toExpenseListItems(expenses: (Expense & { property?: Pick<Property, "name"> })[]): ExpenseListItem[] {
  return expenses.map(toExpenseListItem);
}

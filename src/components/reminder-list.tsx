"use client";

import { useState } from "react";
import { Reminder } from "@prisma/client";
import { deleteReminder, toggleReminder, updateReminder } from "@/lib/actions/reminders";
import { formatDate, toDateInputValue } from "@/lib/format";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui/primitives";

export interface ReminderWithProperty extends Reminder {
  property?: { name: string } | null;
}

function ReminderItem({ reminder }: { reminder: ReminderWithProperty }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-teal-200 bg-teal-50/40 p-3">
        <form
          action={async (formData) => {
            await updateReminder(reminder.id, formData);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titolo">
              <Input name="title" required defaultValue={reminder.title} />
            </Field>
            <Field label="Scadenza">
              <Input type="date" name="dueDate" defaultValue={toDateInputValue(reminder.dueDate)} />
            </Field>
          </div>
          <Field label="Descrizione">
            <Textarea name="description" rows={2} defaultValue={reminder.description ?? ""} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Salva
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
    <li
      className={`flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 ${reminder.isDone ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <form action={toggleReminder.bind(null, reminder.id)}>
          <button
            type="submit"
            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${reminder.isDone ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
            aria-label="Segna come completato"
          >
            {reminder.isDone ? "✓" : ""}
          </button>
        </form>
        <div>
          <p className={`text-sm font-medium text-slate-800 ${reminder.isDone ? "line-through" : ""}`}>{reminder.title}</p>
          {reminder.description ? <p className="text-xs text-slate-500">{reminder.description}</p> : null}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {reminder.dueDate ? <Badge color="amber">{formatDate(reminder.dueDate)}</Badge> : null}
            {reminder.property ? <Badge>{reminder.property.name}</Badge> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => setEditing(true)} className="text-slate-400 hover:text-teal-700" aria-label="Modifica">
          ✎
        </button>
        <form action={deleteReminder.bind(null, reminder.id)}>
          <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Elimina">
            ✕
          </button>
        </form>
      </div>
    </li>
  );
}

export function ReminderList({ reminders }: { reminders: ReminderWithProperty[] }) {
  if (reminders.length === 0) {
    return <p className="text-sm text-slate-500">Nessun promemoria personale.</p>;
  }

  return (
    <ul className="space-y-2">
      {reminders.map((r) => (
        <ReminderItem key={r.id} reminder={r} />
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { Note } from "@prisma/client";
import { createNote, deleteNote, updateNote } from "@/lib/actions/notes";
import { formatDate } from "@/lib/format";
import { MONTH_NAMES_IT } from "@/lib/calc";
import { Badge, Button, Select, Textarea } from "@/components/ui/primitives";

export interface NoteWithProperty extends Note {
  property?: { name: string } | null;
}

function NoteItem({ note }: { note: NoteWithProperty }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-teal-200 bg-teal-50/40 p-3">
        <form
          action={async (formData) => {
            await updateNote(note.id, formData);
            setEditing(false);
          }}
          className="space-y-2"
        >
          <Textarea name="content" required rows={3} defaultValue={note.content} />
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
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setEditing(true)} className="text-slate-400 hover:text-teal-700" aria-label="Modifica nota">
            ✎
          </button>
          <form action={deleteNote.bind(null, note.id)}>
            <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Elimina nota">
              ✕
            </button>
          </form>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <span>{formatDate(note.createdAt)}</span>
        {note.month ? (
          <span>
            · {MONTH_NAMES_IT[note.month - 1]} {note.year}
          </span>
        ) : null}
        {note.property ? <Badge>{note.property.name}</Badge> : null}
      </div>
    </li>
  );
}

export function NotesPanel({
  notes,
  propertyId,
  properties,
}: {
  notes: NoteWithProperty[];
  propertyId?: string;
  properties?: { id: string; name: string }[];
}) {
  const now = new Date();

  return (
    <div className="space-y-4">
      <form action={createNote} className="space-y-3 rounded-xl border border-slate-200 p-4">
        {propertyId ? (
          <input type="hidden" name="propertyId" value={propertyId} />
        ) : properties && properties.length > 0 ? (
          <Select name="propertyId" defaultValue="">
            <option value="">Nota generale (nessun appartamento)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        ) : null}

        {propertyId ? (
          <div className="grid grid-cols-2 gap-3">
            <Select name="month" defaultValue={String(now.getUTCMonth() + 1)}>
              <option value="">Nessun mese specifico</option>
              {MONTH_NAMES_IT.map((label, i) => (
                <option key={i} value={i + 1}>
                  {label}
                </option>
              ))}
            </Select>
            <Select name="year" defaultValue={String(now.getUTCFullYear())}>
              {Array.from({ length: 5 }, (_, i) => now.getUTCFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <Textarea name="content" required rows={3} placeholder="Scrivi una nota..." />
        <Button type="submit" size="sm">
          Aggiungi nota
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna nota.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

import { Note, Property } from "@prisma/client";
import { createNote, deleteNote } from "@/lib/actions/notes";
import { formatDate } from "@/lib/format";
import { MONTH_NAMES_IT } from "@/lib/calc";
import { Badge, Button, Select, Textarea } from "@/components/ui/primitives";

export function NotesPanel({
  notes,
  propertyId,
  properties,
}: {
  notes: (Note & { property?: Property | null })[];
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
            <li key={n.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
                <form action={deleteNote.bind(null, n.id)}>
                  <button type="submit" className="shrink-0 text-slate-400 hover:text-red-600" aria-label="Elimina nota">
                    ✕
                  </button>
                </form>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span>{formatDate(n.createdAt)}</span>
                {n.month ? <span>· {MONTH_NAMES_IT[n.month - 1]} {n.year}</span> : null}
                {n.property ? <Badge>{n.property.name}</Badge> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

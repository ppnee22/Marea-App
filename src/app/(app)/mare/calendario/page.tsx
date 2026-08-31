import Link from "next/link";
import { ensureSeasideProperty } from "@/lib/actions/properties";
import { getBookingsInRange } from "@/lib/queries";
import { MONTH_NAMES_IT } from "@/lib/calc";
import { Badge, Card } from "@/components/ui/primitives";
import { PLATFORM_LABELS } from "@/lib/labels";

function startOfMonthUTC(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function isSameUTCDate(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getUTCFullYear();
  const month = params.month ? Number(params.month) : now.getUTCMonth() + 1;

  const property = await ensureSeasideProperty();
  const monthStart = startOfMonthUTC(year, month);
  const monthEnd = startOfMonthUTC(...([addMonths(year, month, 1).year, addMonths(year, month, 1).month] as [number, number]));

  const bookings = await getBookingsInRange(property.id, monthStart, monthEnd);

  const firstWeekday = (monthStart.getUTCDay() + 6) % 7; // lunedì = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function bookingsForDay(day: number) {
    const date = new Date(Date.UTC(year, month - 1, day));
    return bookings.filter((b) => date >= b.checkIn && date < b.checkOut);
  }

  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Calendario — {property.name}</h1>
        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
          <Link href={`/mare/calendario?year=${prev.year}&month=${prev.month}`} className="shrink-0 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 sm:px-3">
            ← <span className="hidden sm:inline">{MONTH_NAMES_IT[prev.month - 1]}</span>
          </Link>
          <span className="font-medium text-slate-800">
            {MONTH_NAMES_IT[month - 1]} {year}
          </span>
          <Link href={`/mare/calendario?year=${next.year}&month=${next.month}`} className="shrink-0 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 sm:px-3">
            <span className="hidden sm:inline">{MONTH_NAMES_IT[next.month - 1]}</span> →
          </Link>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-sky-200" /> Booking
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-purple-200" /> Airbnb
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-slate-100" /> Libero
        </span>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dayBookings = bookingsForDay(day);
            const date = new Date(Date.UTC(year, month - 1, day));
            const checkIns = bookings.filter((b) => isSameUTCDate(b.checkIn, date));
            const checkOuts = bookings.filter((b) => isSameUTCDate(b.checkOut, date));
            const bg =
              dayBookings.length === 0
                ? "bg-slate-50"
                : dayBookings[0].platform === "BOOKING"
                  ? "bg-sky-100"
                  : "bg-purple-100";

            return (
              <div key={i} className={`min-h-16 rounded-lg p-1.5 text-xs ${bg}`}>
                <div className="font-medium text-slate-700">{day}</div>
                {checkIns.map((b) => (
                  <Link key={`in-${b.id}`} href={`/mare/prenotazioni/${b.id}`} className="mt-0.5 block truncate rounded bg-emerald-200 px-1 text-emerald-800">
                    ▶ {b.guestName}
                  </Link>
                ))}
                {checkOuts.map((b) => (
                  <Link key={`out-${b.id}`} href={`/mare/prenotazioni/${b.id}`} className="mt-0.5 block truncate rounded bg-amber-200 px-1 text-amber-800">
                    ◀ {b.guestName}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Prenotazioni del mese</h2>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nessuna prenotazione in questo mese.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/mare/prenotazioni/${b.id}`} className="flex items-center gap-2 hover:text-teal-700">
                  <Badge color={b.platform === "BOOKING" ? "blue" : "purple"}>{PLATFORM_LABELS[b.platform]}</Badge>
                  {b.guestName}
                </Link>
                <span className="text-slate-500">
                  {b.checkIn.toLocaleDateString("it-IT")} → {b.checkOut.toLocaleDateString("it-IT")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

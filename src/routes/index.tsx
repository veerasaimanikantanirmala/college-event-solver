import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DAYS, SLOTS, solve, type Equipment, type EventReq, type Result, type Room, type RoomType } from "@/lib/scheduler";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Timetabler — College Event Scheduler" },
      { name: "description", content: "Schedule college events across classrooms, seminar halls, labs and equipment with a conflict-free backtracking solver." },
      { property: "og:title", content: "Timetabler — College Event Scheduler" },
      { property: "og:description", content: "Conflict-free event scheduling with backtracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const uid = () => Math.random().toString(36).slice(2, 8);

const initRooms: Room[] = [
  { id: "r1", name: "CR-101", type: "classroom", capacity: 60 },
  { id: "r2", name: "CR-102", type: "classroom", capacity: 40 },
  { id: "r3", name: "Seminar Hall A", type: "seminar", capacity: 200 },
  { id: "r4", name: "CS Lab 1", type: "lab", capacity: 35 },
];
const initEquip: Equipment[] = [
  { id: "e1", name: "Projector", count: 2 },
  { id: "e2", name: "Sound System", count: 1 },
  { id: "e3", name: "VR Kit", count: 1 },
];
const initEvents: EventReq[] = [
  { id: "a", name: "AI Workshop", organizer: "CS Club", roomType: "lab", attendees: 30, duration: 3, equipment: { e1: 1 } },
  { id: "b", name: "Guest Lecture", organizer: "Dept. Physics", roomType: "seminar", attendees: 150, duration: 2, equipment: { e1: 1, e2: 1 } },
  { id: "c", name: "Debate Finals", organizer: "Lit Society", roomType: "seminar", attendees: 120, duration: 2, equipment: { e2: 1 } },
  { id: "d", name: "Quiz Prelims", organizer: "Quiz Club", roomType: "classroom", attendees: 50, duration: 1, equipment: { e1: 1 } },
  { id: "e", name: "VR Demo", organizer: "Design Club", roomType: "classroom", attendees: 25, duration: 2, equipment: { e3: 1, e1: 1 } },
  { id: "f", name: "Hackathon Kickoff", organizer: "CS Club", roomType: "lab", attendees: 35, duration: 4, equipment: {} },
];

const typeBg: Record<RoomType, string> = { classroom: "bg-classroom", seminar: "bg-seminar", lab: "bg-lab" };
const input = "w-full rounded-sm border border-input bg-card px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Index() {
  const [rooms, setRooms] = useState(initRooms);
  const [equip, setEquip] = useState(initEquip);
  const [events, setEvents] = useState(initEvents);
  const [days, setDays] = useState(3);
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState<EventReq>({ id: "", name: "", organizer: "", roomType: "classroom", attendees: 30, duration: 1, equipment: {} });
  const [roomForm, setRoomForm] = useState<Room>({ id: "", name: "", type: "classroom", capacity: 40 });
  const [eqForm, setEqForm] = useState({ name: "", count: 1 });

  const run = () => setResult(solve(events, rooms, equip, days));
  const evById = Object.fromEntries(events.map((e) => [e.id, e]));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Backtracking constraint solver</p>
        <h1 className="mt-2 text-5xl font-semibold leading-none md:text-6xl">The College <em className="text-accent">Timetabler</em></h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Add events and resources, then let the solver place every event into a room and time slot with no double-booked rooms and no over-used equipment.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-8">
          <section>
            <h2 className="mb-3 text-2xl">Add event</h2>
            <form className="space-y-2 rounded-md border bg-card p-4" onSubmit={(e) => { e.preventDefault(); if (!form.name) return; setEvents([...events, { ...form, id: uid() }]); setForm({ ...form, name: "", organizer: "", equipment: {} }); setResult(null); }}>
              <input className={input} placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={input} placeholder="Organizer" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-muted-foreground">Venue<select className={input} value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value as RoomType })}><option value="classroom">Classroom</option><option value="seminar">Seminar</option><option value="lab">Lab</option></select></label>
                <label className="text-xs text-muted-foreground">People<input type="number" min={1} className={input} value={form.attendees} onChange={(e) => setForm({ ...form, attendees: +e.target.value })} /></label>
                <label className="text-xs text-muted-foreground">Hours<input type="number" min={1} max={8} className={input} value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} /></label>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {equip.map((q) => (
                  <label key={q.id} className="flex items-center gap-1 text-xs">{q.name}
                    <input type="number" min={0} max={q.count} className="w-12 rounded-sm border border-input bg-card px-1 py-0.5" value={form.equipment[q.id] ?? 0} onChange={(e) => setForm({ ...form, equipment: { ...form.equipment, [q.id]: +e.target.value } })} />
                  </label>
                ))}
              </div>
              <button className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Add event</button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 text-2xl">Venues</h2>
            <ul className="space-y-1">
              {rooms.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-sm border bg-card px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${typeBg[r.type]}`} />{r.name}</span>
                  <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">{r.type} · {r.capacity}
                    <button aria-label="Remove venue" className="hover:text-destructive" onClick={() => { setRooms(rooms.filter((x) => x.id !== r.id)); setResult(null); }}>✕</button></span>
                </li>
              ))}
            </ul>
            <form className="mt-2 grid grid-cols-[1fr_100px_70px_auto] gap-1" onSubmit={(e) => { e.preventDefault(); if (!roomForm.name) return; setRooms([...rooms, { ...roomForm, id: uid() }]); setRoomForm({ ...roomForm, name: "" }); setResult(null); }}>
              <input className={input} placeholder="Name" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
              <select className={input} value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as RoomType })}><option value="classroom">Class</option><option value="seminar">Seminar</option><option value="lab">Lab</option></select>
              <input type="number" className={input} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: +e.target.value })} />
              <button className="rounded-sm bg-secondary px-3 text-sm">+</button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 text-2xl">Equipment</h2>
            <ul className="space-y-1">
              {equip.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-sm border bg-card px-3 py-1.5 text-sm">{q.name}
                  <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">×{q.count}
                    <button aria-label="Remove equipment" className="hover:text-destructive" onClick={() => { setEquip(equip.filter((x) => x.id !== q.id)); setEvents(events.map((ev) => { const { [q.id]: _, ...rest } = ev.equipment; return { ...ev, equipment: rest }; })); setResult(null); }}>✕</button></span>
                </li>
              ))}
            </ul>
            <form className="mt-2 grid grid-cols-[1fr_70px_auto] gap-1" onSubmit={(e) => { e.preventDefault(); if (!eqForm.name) return; setEquip([...equip, { id: uid(), ...eqForm }]); setEqForm({ name: "", count: 1 }); }}>
              <input className={input} placeholder="Item" value={eqForm.name} onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })} />
              <input type="number" min={1} className={input} value={eqForm.count} onChange={(e) => setEqForm({ ...eqForm, count: +e.target.value })} />
              <button className="rounded-sm bg-secondary px-3 text-sm">+</button>
            </form>
          </section>
        </aside>

        <main className="space-y-8">
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-2xl">Events <span className="font-mono text-sm text-muted-foreground">({events.length})</span></h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">Days
                  <select className="rounded-sm border border-input bg-card px-2 py-1.5" value={days} onChange={(e) => { setDays(+e.target.value); setResult(null); }}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select>
                </label>
                <button onClick={run} className="rounded-sm bg-accent px-5 py-2 font-medium text-accent-foreground shadow-[3px_3px_0_var(--foreground)] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--foreground)]">Generate schedule →</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left font-mono text-xs uppercase text-muted-foreground"><tr><th className="p-2">Event</th><th className="p-2">Venue</th><th className="p-2">People</th><th className="p-2">Hrs</th><th className="p-2">Equipment</th><th className="p-2">Scheduled</th><th /></tr></thead>
                <tbody>
                  {events.map((ev) => {
                    const a = result?.assignments.find((x) => x.eventId === ev.id);
                    const room = rooms.find((r) => r.id === a?.roomId);
                    return (
                      <tr key={ev.id} className="border-t">
                        <td className="p-2"><div className="font-medium">{ev.name}</div><div className="text-xs text-muted-foreground">{ev.organizer}</div></td>
                        <td className="p-2"><span className={`rounded-sm px-1.5 py-0.5 text-xs ${typeBg[ev.roomType]}`}>{ev.roomType}</span></td>
                        <td className="p-2 font-mono">{ev.attendees}</td>
                        <td className="p-2 font-mono">{ev.duration}</td>
                        <td className="p-2 text-xs">{Object.entries(ev.equipment).filter(([, n]) => n).map(([k, n]) => `${equip.find((q) => q.id === k)?.name ?? "?"}×${n}`).join(", ") || "—"}</td>
                        <td className="p-2 font-mono text-xs">{a && room ? `${DAYS[a.day]} ${SLOTS[a.start]}:00–${SLOTS[a.start] + ev.duration}:00 · ${room.name}` : "—"}</td>
                        <td className="p-2"><button aria-label="Remove event" className="text-muted-foreground hover:text-destructive" onClick={() => { setEvents(events.filter((x) => x.id !== ev.id)); setResult(null); }}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {result && (
            <section>
              <div className={`mb-4 rounded-md border-2 p-4 ${result.ok ? "border-foreground bg-lab" : "border-destructive bg-card"}`}>
                <p className="font-display text-xl">{result.ok ? "Conflict-free schedule found" : "Could not schedule all events"}</p>
                <p className="font-mono text-xs text-muted-foreground">{result.failed ? result.failed + " · " : ""}{result.steps.toLocaleString()} placements tried · {result.backtracks.toLocaleString()} backtracks</p>
              </div>
              {result.ok && Array.from({ length: days }, (_, d) => (
                <div key={d} className="mb-6">
                  <h3 className="mb-2 text-xl">{DAYS[d]}</h3>
                  <div className="overflow-x-auto rounded-md border bg-card">
                    <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `140px repeat(${SLOTS.length}, 1fr)` }}>
                      <div className="border-b bg-muted p-2" />
                      {SLOTS.map((h) => <div key={h} className="border-b border-l bg-muted p-2 text-center font-mono text-xs">{h}:00</div>)}
                      {rooms.map((r, ri) => (
                        <div key={r.id} className="contents">
                          <div className="border-b p-2 text-sm font-medium" style={{ gridRow: ri + 2 }}>{r.name}</div>
                          {SLOTS.map((_, si) => <div key={si} className="border-b border-l" style={{ gridRow: ri + 2, gridColumn: si + 2 }} />)}
                          {result.assignments.filter((a) => a.day === d && a.roomId === r.id).map((a) => {
                            const ev = evById[a.eventId];
                            return (
                              <div key={a.eventId} className={`m-1 rounded-sm border border-foreground/30 p-1.5 text-xs ${typeBg[r.type]}`} style={{ gridRow: ri + 2, gridColumn: `${a.start + 2} / span ${ev.duration}` }}>
                                <div className="font-semibold">{ev.name}</div><div className="opacity-70">{ev.organizer}</div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export type RoomType = "classroom" | "seminar" | "lab";
export interface Room { id: string; name: string; type: RoomType; capacity: number }
export interface Equipment { id: string; name: string; count: number }
export interface EventReq {
  id: string; name: string; organizer: string; roomType: RoomType;
  attendees: number; duration: number; equipment: Record<string, number>;
}
export interface Assignment { eventId: string; roomId: string; day: number; start: number }
export interface Result { ok: boolean; assignments: Assignment[]; steps: number; backtracks: number; failed?: string }

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const SLOTS = [9, 10, 11, 12, 13, 14, 15, 16]; // start hours, each 1h

export function solve(events: EventReq[], rooms: Room[], equipment: Equipment[], days = DAYS.length): Result {
  // Most constrained first: longer + more equipment + bigger
  const order = [...events].sort((a, b) =>
    b.duration * 10 + Object.values(b.equipment).reduce((s, n) => s + n, 0) * 5 + b.attendees / 50 -
    (a.duration * 10 + Object.values(a.equipment).reduce((s, n) => s + n, 0) * 5 + a.attendees / 50));
  const S = SLOTS.length;
  const roomBusy = new Map<string, boolean[]>(rooms.map((r) => [r.id, Array(days * S).fill(false)]));
  const equipUsed = new Map<string, number[]>(equipment.map((e) => [e.id, Array(days * S).fill(0)]));
  const eqCap = new Map(equipment.map((e) => [e.id, e.count]));
  const out: Assignment[] = [];
  let steps = 0, backtracks = 0;
  const LIMIT = 200000;

  for (const ev of order) {
    if (!rooms.some((r) => r.type === ev.roomType && r.capacity >= ev.attendees))
      return { ok: false, assignments: [], steps, backtracks, failed: `No ${ev.roomType} fits ${ev.attendees} people for "${ev.name}"` };
    for (const [k, n] of Object.entries(ev.equipment))
      if (n > (eqCap.get(k) ?? 0))
        return { ok: false, assignments: [], steps, backtracks, failed: `"${ev.name}" needs more equipment than exists` };
  }

  const fits = (ev: EventReq, room: Room, day: number, start: number) => {
    if (start + ev.duration > S) return false;
    const busy = roomBusy.get(room.id)!;
    for (let t = start; t < start + ev.duration; t++) {
      const i = day * S + t;
      if (busy[i]) return false;
      for (const [k, n] of Object.entries(ev.equipment)) if (n && equipUsed.get(k)![i] + n > eqCap.get(k)!) return false;
    }
    return true;
  };
  const mark = (ev: EventReq, room: Room, day: number, start: number, on: boolean) => {
    for (let t = start; t < start + ev.duration; t++) {
      const i = day * S + t;
      roomBusy.get(room.id)![i] = on;
      for (const [k, n] of Object.entries(ev.equipment)) equipUsed.get(k)![i] += on ? n : -n;
    }
  };

  const bt = (idx: number): boolean => {
    if (idx === order.length) return true;
    if (steps > LIMIT) return false;
    const ev = order[idx];
    // smallest fitting room first to save big rooms
    const cands = rooms.filter((r) => r.type === ev.roomType && r.capacity >= ev.attendees).sort((a, b) => a.capacity - b.capacity);
    for (let day = 0; day < days; day++)
      for (let start = 0; start < S; start++)
        for (const room of cands) {
          steps++;
          if (!fits(ev, room, day, start)) continue;
          mark(ev, room, day, start, true);
          out.push({ eventId: ev.id, roomId: room.id, day, start });
          if (bt(idx + 1)) return true;
          out.pop(); mark(ev, room, day, start, false); backtracks++;
        }
    return false;
  };

  const ok = bt(0);
  return { ok, assignments: ok ? [...out] : [], steps, backtracks, failed: ok ? undefined : steps > LIMIT ? "Search limit reached" : "No conflict-free schedule exists with these resources" };
}

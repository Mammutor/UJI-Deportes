import { tr } from "./locale.js";
import {
  COURTS,
  SPORTS,
  getSport,
  maxHalfHourBlocks,
  type AvailabilitySlot,
  type Booking,
  type Court,
  type Sport,
  type SportId,
  type UjiUser,
} from "../shared/uji.js";

type Store = {
  users: Map<string, { password: string; user: UjiUser }>;
  bookings: Map<string, Booking>;
  occupied: Map<string, string>;
};

const g = globalThis as unknown as { __ujiStore?: Store };
const SLOT_MINUTES = 30;

function store(): Store {
  if (!g.__ujiStore) {
    g.__ujiStore = {
      users: new Map([
        [
          "demo",
          {
            password: "demo",
            user: {
              username: "demo",
              displayName: "Demo Usuari",
              email: "demo@uji.es",
            },
          },
        ],
        [
          "alumne",
          {
            password: "uji2026",
            user: {
              username: "alumne",
              displayName: "Alumne UJI",
              email: "alumne@uji.es",
            },
          },
        ],
      ]),
      bookings: new Map(),
      occupied: new Map(),
    };
    seed(g.__ujiStore);
  }
  return g.__ujiStore;
}

function hash(courtId: string, date: string, start: string) {
  return `${courtId}|${date}|${start}`;
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function todayPlus(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seed(s: Store) {
  for (const [courtId, date, start] of [
    ["padel-1", todayPlus(0), "10:00"],
    ["padel-1", todayPlus(0), "10:30"],
    ["padel-1", todayPlus(0), "11:00"],
    ["padel-2", todayPlus(0), "18:00"],
    ["padel-2", todayPlus(0), "18:30"],
    ["padel-1", todayPlus(1), "17:00"],
    ["padel-1", todayPlus(1), "17:30"],
    ["tennis-1", todayPlus(0), "11:00"],
    ["tennis-1", todayPlus(0), "11:30"],
    ["fut7-1", todayPlus(2), "19:00"],
    ["fut7-1", todayPlus(2), "19:30"],
    ["fut7-1", todayPlus(2), "20:00"],
  ] as const) {
    s.occupied.set(hash(courtId, date, start), "system");
  }
}

function hours(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return { start: 0, end: 0 };
  if (day === 6) return { start: 9, end: 14 };
  return { start: 9, end: 21 };
}

function slotsFor(court: Court, date: string, occupied: Map<string, string>) {
  const sport = getSport(court.sportId);
  const h = hours(date);
  if (h.start === h.end) return [] as AvailabilitySlot[];
  const now = new Date();
  const out: AvailabilitySlot[] = [];
  for (let mins = h.start * 60; mins + SLOT_MINUTES <= h.end * 60; mins += SLOT_MINUTES) {
    const startH = Math.floor(mins / 60);
    const startM = mins % 60;
    const startTime = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
    const endTime = addMinutes(startTime, SLOT_MINUTES);
    const id = hash(court.id, date, startTime);
    const start = new Date(`${date}T${startTime}:00`);
    let status: AvailabilitySlot["status"] = "available";
    if (start < now) status = "past";
    else if (occupied.has(id)) status = "booked";
    out.push({
      id,
      courtId: court.id,
      sportId: court.sportId,
      date,
      startTime,
      endTime,
      status,
      live: {
        instalacionId: court.id,
        cuadro: String(mins / SLOT_MINUTES),
        code: court.id,
        maxHours: sport.maxHours,
      },
    });
  }
  return out;
}

export class MockStore {
  login(username: string, password: string) {
    if (!username.trim() || !password.trim()) {
      throw new Error(tr("err.demoCredentials"));
    }
    const s = store();
    const key = username.toLowerCase();
    const record = s.users.get(key);
    if (record) {
      if (record.password !== password) {
        throw new Error(tr("err.demoWrong"));
      }
      return record.user;
    }
    const user: UjiUser = {
      username: key,
      displayName: username,
      email: `${key}@uji.es`,
    };
    s.users.set(key, { password, user });
    return user;
  }

  listSports(): Sport[] {
    return SPORTS;
  }

  listCourts(sportId?: SportId): Court[] {
    return sportId ? COURTS.filter((c) => c.sportId === sportId) : COURTS;
  }

  getAvailability(sportId: SportId, date: string, courtId?: string) {
    const s = store();
    const courts = COURTS.filter(
      (c) => c.sportId === sportId && (!courtId || c.id === courtId),
    );
    return {
      courts,
      slots: courts.flatMap((c) => slotsFor(c, date, s.occupied)),
      slotMinutes: SLOT_MINUTES,
      maxHours: getSport(sportId).maxHours,
    };
  }

  /** Book one or more consecutive half-hour slots on the same court. */
  createBooking(slotIds: string[], user: UjiUser): Booking {
    const s = store();
    if (!slotIds.length) throw new Error(tr("err.needSlot"));
    const unique = [...new Set(slotIds)];
    const parsed = unique.map((id) => {
      const [courtId, date, startTime] = id.split("|");
      if (!courtId || !date || !startTime) throw new Error(tr("err.badSlot"));
      return { id, courtId, date, startTime };
    });
    const courtId = parsed[0].courtId;
    const date = parsed[0].date;
    if (parsed.some((p) => p.courtId !== courtId || p.date !== date)) {
      throw new Error(tr("err.sameCourt"));
    }
    parsed.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const court = COURTS.find((c) => c.id === courtId);
    if (!court) throw new Error(tr("err.courtMissing"));
    const sport = getSport(court.sportId);
    const maxBlocks = maxHalfHourBlocks(sport.maxHours);
    if (parsed.length > maxBlocks) {
      throw new Error(
        tr("err.maxHours", { hours: sport.maxHours, blocks: maxBlocks }),
      );
    }
    for (let i = 1; i < parsed.length; i++) {
      if (
        toMinutes(parsed[i].startTime) !==
        toMinutes(parsed[i - 1].startTime) + SLOT_MINUTES
      ) {
        throw new Error(tr("err.consecutive"));
      }
    }
    for (const p of parsed) {
      if (s.occupied.has(p.id)) throw new Error(tr("err.occupied"));
    }

    const startTime = parsed[0].startTime;
    const endTime = addMinutes(parsed[parsed.length - 1].startTime, SLOT_MINUTES);
    const booking: Booking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      courtId,
      courtName: court.name,
      sportId: court.sportId,
      sportName: sport.nameCa,
      date,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    for (const p of parsed) s.occupied.set(p.id, user.username);
    s.bookings.set(booking.id, booking);
    return booking;
  }

  listBookings(user: UjiUser): Booking[] {
    const s = store();
    return [...s.bookings.values()]
      .filter((b) => {
        if (b.status !== "confirmed") return false;
        const key = hash(b.courtId, b.date, b.startTime);
        return s.occupied.get(key) === user.username;
      })
      .sort((a, b) =>
        `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
      );
  }

  cancelBooking(bookingId: string, user: UjiUser): Booking {
    const s = store();
    const booking = s.bookings.get(bookingId);
    if (!booking) throw new Error(tr("err.bookingMissing"));
    const startKey = hash(booking.courtId, booking.date, booking.startTime);
    if (s.occupied.get(startKey) !== user.username) {
      throw new Error(tr("err.cannotCancel"));
    }
    // Free every half-hour block covered by this booking.
    for (
      let t = toMinutes(booking.startTime);
      t < toMinutes(booking.endTime);
      t += SLOT_MINUTES
    ) {
      const hh = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      s.occupied.delete(hash(booking.courtId, booking.date, hh));
    }
    booking.status = "cancelled";
    s.bookings.set(bookingId, booking);
    return booking;
  }
}

export const mockStore = new MockStore();

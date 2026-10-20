import { parseLocale, t, type Locale, type MessageKey } from "../../shared/i18n";

export const UJI_ENDPOINTS = {
  bookingEntry: "https://e-ujier.uji.es/pls/www/!uji_sports.usuari",
  infoPage: "https://www.uji.es/esports/base/instalacions/reservas-prestec/",
} as const;

export type SportId =
  | "padel"
  | "padelVidre"
  | "tennis"
  | "squash"
  | "pickleball"
  | "badminton"
  | "escalada"
  | "fronto"
  | "ironfit"
  | "football7"
  | "volleyball"
  | "tableTennis"
  | "other";

export interface Sport {
  id: SportId;
  nameCa: string;
  zone: string;
  slotMinutes: number;
  maxHours: number;
}

export interface Court {
  id: string;
  name: string;
  sportId: SportId;
  indoor: boolean;
  code?: string;
  label?: string;
}

export interface LiveSlotMeta {
  instalacionId: string;
  cuadro: string;
  code: string;
  maxHours: number;
  buttonId?: string;
  plsql?: string;
  token?: string;
}

export interface AvailabilitySlot {
  id: string;
  courtId: string;
  sportId: SportId;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "blocked" | "past";
  live?: LiveSlotMeta;
}

export interface LiveBookingMeta {
  reservaId: string;
  buttonId: string;
  plsql: string;
  firma: string;
  code?: string;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  sportId: SportId;
  sportName: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  status: "confirmed" | "cancelled";
  live?: LiveBookingMeta;
}

export interface UjiUser {
  username: string;
  displayName: string;
  email?: string;
}

export interface SessionMeta {
  liveSession: boolean;
  expiresAt?: string;
  expiresInSeconds?: number;
  ujiCookieTtlSeconds: number;
  note: string;
}

export interface SessionInfo {
  authenticated: boolean;
  user: UjiUser | null;
  mode: "mock" | "live";
  configuredMode: "mock" | "live";
  endpoints: typeof UJI_ENDPOINTS;
  sessionMeta?: SessionMeta;
}

export const SPORTS: Sport[] = [
  { id: "padel", nameCa: "Pàdel", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  { id: "padelVidre", nameCa: "Pàdel Vidre", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  { id: "tennis", nameCa: "Tenis", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  { id: "squash", nameCa: "Esquaix", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  {
    id: "pickleball",
    nameCa: "Pickleball",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  { id: "badminton", nameCa: "Bàdminton", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  {
    id: "escalada",
    nameCa: "Escalada/Boulder",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  { id: "fronto", nameCa: "Frontó", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  { id: "ironfit", nameCa: "Ironfit", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
  {
    id: "football7",
    nameCa: "Futbol 7",
    zone: "Zona d'aire lliure",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "volleyball",
    nameCa: "Vòlei platja",
    zone: "Zona d'aire lliure",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  { id: "tableTennis", nameCa: "Tennis taula", zone: "Tennis taula", slotMinutes: 30, maxHours: 1.5 },
  { id: "other", nameCa: "Altres", zone: "Zona de raquetes", slotMinutes: 30, maxHours: 1.5 },
];

export type ZoneId = "rackets" | "pavilion" | "outdoor" | "table";

export const ZONES: ZoneId[] = ["rackets", "pavilion", "outdoor", "table"];

function ct(key: MessageKey, vars?: Record<string, string | number>) {
  let locale: Locale = "va";
  try {
    locale = parseLocale(localStorage.getItem("uji-locale")) ?? "va";
  } catch {
    /* ignore */
  }
  return t(locale, key, vars);
}

export function maxHalfHourBlocks(maxHours: number): number {
  return Math.max(1, Math.round(maxHours * 2));
}

function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  try {
    const locale = localStorage.getItem("uji-locale");
    if (locale) headers.set("x-uji-locale", locale);
  } catch {
    /* ignore */
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
    cache: init.cache ?? "no-store",
  });
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.ok ? ct("err.emptyBody") : ct("err.emptyHttp", { status: res.status }),
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(ct("err.notJson", { status: res.status }));
  }
}

export async function fetchSession() {
  const res = await apiFetch("/api/auth", { credentials: "include" });
  return readJson<SessionInfo>(res);
}

export async function login(username: string, password: string, otp?: string) {
  const res = await apiFetch("/api/auth", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, otp: otp?.trim() || undefined }),
  });
  const data = await readJson<{
    ok: boolean;
    error?: string;
    sessionMeta?: SessionMeta;
  }>(res);
  if (!res.ok || !data.ok) {
    throw new Error(data.error || ct("err.loginHttp", { status: res.status }));
  }

  // The cookie is HttpOnly, so the only proof it stuck is a follow-up read.
  // A service worker or the browser can miss it on the first attempt.
  let session = await fetchSession();
  for (let attempt = 0; !session.authenticated && attempt < 4; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    session = await fetchSession();
  }
  if (!session.authenticated) {
    throw new Error(ct("err.cookieMissing"));
  }
  return { ...data, session };
}

export async function ujiProxy(input: {
  procedure?: string;
  url?: string;
  body?: string;
  method?: string;
}) {
  const res = await apiFetch("/api/uji/proxy", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{
    ok?: boolean;
    body?: string;
    error?: string;
    status?: number;
    sessionMeta?: SessionMeta;
  }>(res);
  if (!res.ok || !data.ok) throw new Error(data.error || ct("err.proxyFailed"));
  return data;
}

export async function logout() {
  await apiFetch("/api/auth", { method: "DELETE", credentials: "include" });
}

export type AvailabilityScope = "zone" | "all";

export interface AvailabilityDay {
  date: string;
  courts: Court[];
  slots: AvailabilitySlot[];
  live: boolean;
  unavailable?: boolean;
  warning?: string;
  needsRelogin?: boolean;
  maxHours?: number;
  slotMinutes?: number;
}

const availabilityInflight = new Map<
  string,
  Promise<{
    days?: AvailabilityDay[];
    error?: string;
    live?: boolean;
    warning?: string;
    needsRelogin?: boolean;
    scope?: AvailabilityScope;
    zone?: ZoneId;
  }>
>();

export async function fetchAvailabilityBatch(input: {
  dates: string[];
  scope: AvailabilityScope;
  zone?: ZoneId;
}) {
  const params = new URLSearchParams({
    dates: input.dates.join(","),
    scope: input.scope,
  });
  if (input.scope === "zone" && input.zone) {
    params.set("zone", input.zone);
  }
  const key = params.toString();
  const existing = availabilityInflight.get(key);
  if (existing) return existing;

  const pending = (async () => {
    const res = await apiFetch(`/api/availability/batch?${key}`, {
      credentials: "include",
    });
    const data = await readJson<{
      days?: AvailabilityDay[];
      error?: string;
      live?: boolean;
      warning?: string;
      needsRelogin?: boolean;
      scope?: AvailabilityScope;
      zone?: ZoneId;
    }>(res);
    if (!res.ok && !data.days?.length) {
      throw new Error(data.error || ct("err.availability"));
    }
    return data;
  })();

  availabilityInflight.set(key, pending);
  try {
    return await pending;
  } finally {
    if (availabilityInflight.get(key) === pending) {
      availabilityInflight.delete(key);
    }
  }
}

export async function fetchAvailability(sportId: SportId, date: string) {
  const res = await apiFetch(
    `/api/availability?sportId=${sportId}&date=${date}`,
    { credentials: "include" },
  );
  const data = await readJson<{
    slots?: AvailabilitySlot[];
    courts?: Court[];
    error?: string;
    live?: boolean;
    hint?: string;
    warning?: string;
    needsRelogin?: boolean;
    slotMinutes?: number;
    maxHours?: number;
    reservationTypes?: { id: string; name: string }[];
    sessionMeta?: SessionMeta;
  }>(res);
  if (!res.ok && !data.courts?.length) {
    throw new Error(data.error || ct("err.availability"));
  }
  return data;
}

export async function createBooking(input: {
  slotIds?: string[];
  slots?: AvailabilitySlot[];
  courtName?: string;
}) {
  const res = await apiFetch("/api/bookings", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slotIds: input.slotIds,
      slotId: input.slotIds?.[0],
      slots: input.slots,
      courtName: input.courtName,
    }),
  });
  const data = await readJson<{
    ok?: boolean;
    booking?: Booking;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(data.error || ct("err.bookingFailed"));
  return data.booking!;
}

export async function listBookings() {
  const res = await apiFetch("/api/bookings", { credentials: "include" });
  const data = await readJson<{ bookings?: Booking[]; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || ct("err.bookingsList"));
  return data.bookings ?? [];
}

export async function cancelBooking(id: string) {
  const res = await apiFetch(`/api/bookings?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await readJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || ct("err.cancelFailed"));
}

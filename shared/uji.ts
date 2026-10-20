export type UjiMode = "mock" | "live";

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
  name: string;
  nameCa: string;
  zone: string;
  /** Display default; live portal uses 30-minute cuadros. */
  slotMinutes: number;
  /** Max consecutive hours allowed when booking (portal: often 1,5). */
  maxHours: number;
}

export interface Court {
  id: string;
  name: string;
  sportId: SportId;
  indoor: boolean;
  /** Facility code from e-UJIer, e.g. DAA012PA. */
  code?: string;
  /** Heading for a facility the catalog does not name, taken from the portal. */
  label?: string;
}

export type SlotStatus = "available" | "booked" | "blocked" | "past";

/** Metadata from e-UJIer reservas_disponible click handlers. */
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
  status: SlotStatus;
  live?: LiveSlotMeta;
}

/** Cancel metadata from listado_reservas button_action2. */
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

export interface SessionInfo {
  authenticated: boolean;
  user: UjiUser | null;
  mode: UjiMode;
  configuredMode: UjiMode;
  endpoints: typeof UJI_ENDPOINTS;
}

export const UJI_ENDPOINTS = {
  bookingEntry: "https://e-ujier.uji.es/pls/www/!uji_sports.usuari",
  infoPage: "https://www.uji.es/esports/base/instalacions/reservas-prestec/",
  poolOccupancy: "https://e-ujier.uji.es/pls/www/!uji_sports.ocupacion_piscina",
  ssoIdp: "https://xmlrpc.uji.es/simplesaml/saml2/idp/SSOService.php",
  iglu: "https://www.uji.es/upo/rest/iglu/",
} as const;

export const SPORTS: Sport[] = [
  {
    id: "padel",
    name: "Padel",
    nameCa: "Pàdel",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "padelVidre",
    name: "Padel glass",
    nameCa: "Pàdel Vidre",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "tennis",
    name: "Tennis",
    nameCa: "Tenis",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "squash",
    name: "Squash",
    nameCa: "Esquaix",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "pickleball",
    name: "Pickleball",
    nameCa: "Pickleball",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "badminton",
    name: "Badminton",
    nameCa: "Bàdminton",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "escalada",
    name: "Climbing",
    nameCa: "Escalada/Boulder",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "fronto",
    name: "Fronton",
    nameCa: "Frontó",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "ironfit",
    name: "Ironfit",
    nameCa: "Ironfit",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "football7",
    name: "Football 7",
    nameCa: "Futbol 7",
    zone: "Zona d'aire lliure",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "volleyball",
    name: "Beach volleyball",
    nameCa: "Vòlei platja",
    zone: "Zona d'aire lliure",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "tableTennis",
    name: "Table tennis",
    nameCa: "Tennis taula",
    zone: "Tennis taula",
    slotMinutes: 30,
    maxHours: 1.5,
  },
  {
    id: "other",
    name: "Other",
    nameCa: "Altres",
    zone: "Zona de raquetes",
    slotMinutes: 30,
    maxHours: 1.5,
  },
];

/** e-UJIer reservation types. One request returns every court in that type. */
export const ZONES = [
  { id: "rackets", match: /raquet/i },
  { id: "pavilion", match: /pavell|poliesport/i },
  { id: "outdoor", match: /aire|lliure/i },
  { id: "table", match: /taula/i },
] as const;

export type ZoneId = (typeof ZONES)[number]["id"];

const ZONE_FOR_SPORT: Record<SportId, ZoneId> = {
  padel: "rackets",
  padelVidre: "rackets",
  tennis: "rackets",
  squash: "rackets",
  pickleball: "rackets",
  badminton: "rackets",
  fronto: "rackets",
  ironfit: "rackets",
  escalada: "rackets",
  football7: "outdoor",
  volleyball: "outdoor",
  tableTennis: "table",
  other: "rackets",
};

export function zoneForSport(id: SportId): ZoneId {
  return ZONE_FOR_SPORT[id];
}

/** Map a portal facility name to a sport. Null means show it under its own name. */
export function mapFacilityToSport(name: string): SportId | null {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (n.includes("vidre")) return "padelVidre";
  if (n.includes("padel")) return "padel";
  if (n.includes("taula") || n.includes("ping")) return "tableTennis";
  if (n.includes("tennis") || n.includes("tenis")) return "tennis";
  if (n.includes("esquaix") || n.includes("squash")) return "squash";
  if (n.includes("pickle")) return "pickleball";
  if (n.includes("badminton") || n.includes("badmint")) return "badminton";
  if (n.includes("escalada") || n.includes("boulder")) return "escalada";
  if (n.includes("front")) return "fronto";
  if (n.includes("ironfit") || n.includes("ironlift") || n.includes("iron")) {
    return "ironfit";
  }
  if (
    n.includes("rugbi") ||
    n.includes("rugby") ||
    n.includes("futbol 11") ||
    n.includes("futbol11") ||
    n.includes("sala") ||
    n.includes("futsal")
  ) {
    return null;
  }
  if (n.includes("futbol") || n.includes("football")) return "football7";
  if (n.includes("volei") || n.includes("volley")) return "volleyball";
  return null;
}

/** Half-hour blocks allowed for a given maxHours (e.g. 1.5 → 3). */
export function maxHalfHourBlocks(maxHours: number): number {
  return Math.max(1, Math.round(maxHours * 2));
}

export const COURTS: Court[] = [
  { id: "padel-1", name: "Pàdel 1", sportId: "padel", indoor: false },
  { id: "padel-2", name: "Pàdel 2", sportId: "padel", indoor: false },
  { id: "padel-3", name: "Pàdel 3", sportId: "padel", indoor: false },
  { id: "padel-4", name: "Pàdel 4", sportId: "padel", indoor: true },
  { id: "padel-vidre-1", name: "Pàdel Vidre 1", sportId: "padelVidre", indoor: false, code: "DAA012PA" },
  { id: "padel-vidre-2", name: "Pàdel Vidre 2", sportId: "padelVidre", indoor: false, code: "DAA013PA" },
  { id: "tennis-1", name: "Tenis 1", sportId: "tennis", indoor: false },
  { id: "tennis-2", name: "Tenis 2", sportId: "tennis", indoor: false },
  { id: "squash-1", name: "Esquaix 1", sportId: "squash", indoor: true },
  { id: "squash-2", name: "Esquaix 2", sportId: "squash", indoor: true },
  { id: "pickle-1", name: "Pickleball 1", sportId: "pickleball", indoor: false },
  { id: "pickle-2", name: "Pickleball 2", sportId: "pickleball", indoor: false },
  { id: "pickle-3", name: "Pickleball 3", sportId: "pickleball", indoor: false },
  { id: "badm-1", name: "Bàdminton 1", sportId: "badminton", indoor: true },
  { id: "badm-2", name: "Bàdminton 2", sportId: "badminton", indoor: true },
  { id: "escalada-1", name: "Escalada/Boulder", sportId: "escalada", indoor: true },
  { id: "fronto-1", name: "Frontó 1", sportId: "fronto", indoor: false },
  { id: "fronto-2", name: "Frontó 2", sportId: "fronto", indoor: false },
  { id: "ironfit-1", name: "Ironfit", sportId: "ironfit", indoor: true },
  { id: "fut7-1", name: "Futbol 7 — Camp A", sportId: "football7", indoor: false },
  { id: "volei-1", name: "Vòlei platja 1", sportId: "volleyball", indoor: false },
];

export function getSport(id: SportId): Sport {
  const sport = SPORTS.find((s) => s.id === id);
  if (!sport) throw new Error(`Unknown sport: ${id}`);
  return sport;
}

export function getConfiguredMode(): UjiMode {
  return "live";
}

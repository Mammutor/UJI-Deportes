import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CookieJar, type StoredCookie } from "./cookie-jar.js";
import { UJI_SSO_MAX_AGE_MS } from "./uji-client.js";

export type LiveSessionRecord = {
  sid: string;
  username: string;
  displayName: string;
  email?: string;
  /** e-UJIer p_persona id (from disponibilidad PL/SQL). */
  personaId?: string;
  cookies: StoredCookie[];
  createdAt: number;
  expiresAt: number;
  landingUrl: string;
};

const STORE_PATH = resolve(process.cwd(), ".data", "live-sessions.json");

const g = globalThis as unknown as {
  __ujiLiveSessions?: Map<string, LiveSessionRecord>;
  __ujiLiveSessionsLoaded?: boolean;
};

function secret() {
  return process.env.SESSION_SECRET || "dev-only-change-me-uji-deporte";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function map() {
  if (!g.__ujiLiveSessions) g.__ujiLiveSessions = new Map();
  ensureLoaded();
  return g.__ujiLiveSessions;
}

function ensureLoaded() {
  if (g.__ujiLiveSessionsLoaded) return;
  g.__ujiLiveSessionsLoaded = true;
  if (!g.__ujiLiveSessions) g.__ujiLiveSessions = new Map();
  try {
    if (!existsSync(STORE_PATH)) return;
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      sig?: string;
      sessions?: LiveSessionRecord[];
    };
    const body = JSON.stringify(parsed.sessions ?? []);
    const expected = sign(body);
    if (!parsed.sig || !safeEqual(parsed.sig, expected)) {
      console.warn("[live-sessions] store signature mismatch — ignoring file");
      return;
    }
    const now = Date.now();
    for (const s of parsed.sessions ?? []) {
      if (s.expiresAt > now) g.__ujiLiveSessions.set(s.sid, s);
    }
    console.log(
      `[live-sessions] loaded ${g.__ujiLiveSessions.size} session(s) from disk`,
    );
  } catch (err) {
    console.warn("[live-sessions] failed to load store", err);
  }
}

function safeEqual(a: string, b: string) {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function persist() {
  const sessions = [...map().values()].filter((s) => s.expiresAt > Date.now());
  const body = JSON.stringify(sessions);
  const file = JSON.stringify({ sig: sign(body), sessions }, null, 0);
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, file, "utf8");
}

export function putLiveSession(input: {
  username: string;
  displayName: string;
  email?: string;
  jar: CookieJar;
  expiresAt: number;
  landingUrl: string;
}): LiveSessionRecord {
  const sid = randomUUID();
  const record: LiveSessionRecord = {
    sid,
    username: input.username,
    displayName: input.displayName,
    email: input.email,
    cookies: input.jar.serialize(),
    createdAt: Date.now(),
    expiresAt: input.expiresAt,
    landingUrl: input.landingUrl,
  };
  map().set(sid, record);
  persist();
  return record;
}

export function getLiveSession(sid: string | undefined): LiveSessionRecord | null {
  if (!sid) return null;
  const record = map().get(sid);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    map().delete(sid);
    persist();
    return null;
  }
  return record;
}

export function jarFromLiveSession(record: LiveSessionRecord): CookieJar {
  return CookieJar.deserialize(record.cookies);
}

export function touchLiveSession(sid: string, jar: CookieJar) {
  const record = map().get(sid);
  if (!record) return;
  record.cookies = jar.serialize();
  record.expiresAt = Math.min(
    jar.maxExpiresAt(UJI_SSO_MAX_AGE_MS),
    Date.now() + UJI_SSO_MAX_AGE_MS,
  );
  map().set(sid, record);
  persist();
}

export function setLivePersonaId(sid: string, personaId: string) {
  const record = map().get(sid);
  if (!record || !personaId) return;
  if (record.personaId === personaId) return;
  record.personaId = personaId;
  map().set(sid, record);
  persist();
}

export function deleteLiveSession(sid: string | undefined) {
  if (!sid) return;
  if (map().delete(sid)) persist();
}

export function liveSessionInfo(record: LiveSessionRecord | null) {
  if (!record) {
    return {
      liveSession: false as const,
      ujiCookieTtlSeconds: UJI_SSO_MAX_AGE_MS / 1000,
      note:
        "SimpleSAMLSessionID dura 8 hores (Max-Age=28800). JSESSIONID és cookie de sessió (sense Max-Age); el servidor Oracle pot tallar-la abans per inactivitat.",
    };
  }
  return {
    liveSession: true as const,
    expiresAt: new Date(record.expiresAt).toISOString(),
    expiresInSeconds: Math.max(
      0,
      Math.floor((record.expiresAt - Date.now()) / 1000),
    ),
    ujiCookieTtlSeconds: UJI_SSO_MAX_AGE_MS / 1000,
    note:
      "SimpleSAMLSessionID dura 8 hores. JSESSIONID no porta Max-Age (sessió de navegador / idle timeout al servidor).",
  };
}

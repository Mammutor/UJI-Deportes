import "./load-env.js";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COURTS,
  SPORTS,
  UJI_ENDPOINTS,
  getConfiguredMode,
  type SportId,
} from "../shared/uji.js";
import {
  bookLiveSlots,
  cancelLiveBooking,
  extractPersonaId,
  fetchListadoReservas,
  resolveLiveSlots,
} from "./booking.js";
import {
  deleteLiveSession,
  getLiveSession,
  jarFromLiveSession,
  liveSessionInfo,
  putLiveSession,
  setLivePersonaId,
  touchLiveSession,
} from "./live-sessions.js";
import {
  clearCookie,
  createToken,
  sessionCookie,
  verifyToken,
  type AppSession,
} from "./session.js";
import { parseDisponibilidadHtml } from "./disponibilidad.js";
import { loadPortalAvailability } from "./portal-availability.js";
import {
  UJI_SPORTS_ENDPOINTS,
  fetchDisponibilidad,
  fetchReservationTypes,
  isPortalSessionDead,
  parseHtmlOptions,
  ujiAuthedRequest,
  ujiLiveLogin,
} from "./uji-client.js";
import type { AvailabilitySlot, Court } from "../shared/uji.js";
import { tr, withRequestLocale } from "./locale.js";

const app = new Hono();

app.use("*", async (c, next) => {
  await withRequestLocale(c.req.header("x-uji-locale"), () => next());
});
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "private, no-store");
  await next();
});
const isProd = process.env.NODE_ENV === "production";
// Dev: Vite is on 4321 and proxies /api → API_PORT (4322).
// Prod/Docker: single process uses PORT (often 4321).
const apiPort = Number(
  isProd
    ? process.env.PORT || process.env.API_PORT || 4321
    : process.env.API_PORT || 4322,
);

async function readSession(
  cookieHeader: string | undefined,
): Promise<AppSession | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)uji_deporte_session=([^;]+)/);
  if (!match) return null;
  return verifyToken(decodeURIComponent(match[1]));
}

function requireLiveJar(session: AppSession) {
  const live = getLiveSession(session.sid);
  if (!live) {
    throw new Error(tr("err.sessionMissing"));
  }
  return { live, jar: jarFromLiveSession(live) };
}

function liveCourtsFallback(
  sportId: SportId | undefined,
  date: string | undefined,
  courtId: string | undefined,
  reason: string,
) {
  if (!sportId || !date) {
    return {
      error: tr("err.sportDate"),
      needsRelogin: true,
      reason,
    };
  }
  return {
    courts: [],
    slots: [],
    sportId,
    date,
    live: false,
    needsRelogin: true,
    warning: reason,
    sessionMeta: liveSessionInfo(null),
  };
}

function mapTipoToSportId(name: string): SportId | null {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (n.includes("vidre")) return "padelVidre";
  if (n.includes("padel") || n.includes("paddle")) return "padel";
  if (n.includes("tenis") || n.includes("tennis")) return "tennis";
  if (n.includes("esquaix") || n.includes("squash")) return "squash";
  if (n.includes("pickle")) return "pickleball";
  if (n.includes("badminton") || n.includes("badmint")) return "badminton";
  if (n.includes("escalada") || n.includes("boulder")) return "escalada";
  if (n.includes("front")) return "fronto";
  if (n.includes("ironfit") || n.includes("iron")) return "ironfit";
  if (n.includes("futbol") || n.includes("football")) return "football7";
  if (n.includes("volei") || n.includes("volley")) return "volleyball";
  return null;
}

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    mode: getConfiguredMode(),
    ujiCookieTtlSeconds: 8 * 60 * 60,
  }),
);

app.get("/api/auth", async (c) => {
  const mode = getConfiguredMode();
  const session = await readSession(c.req.header("cookie"));
  const live = session ? getLiveSession(session.sid) : null;
  return c.json({
    authenticated: Boolean(session),
    user: session?.user ?? null,
    mode: session?.mode ?? mode,
    configuredMode: mode,
    endpoints: UJI_ENDPOINTS,
    sessionMeta: liveSessionInfo(live),
  });
});

app.post("/api/auth", async (c) => {
  const mode = getConfiguredMode();
  try {
    const body = await c.req.json<{
      username?: string;
      password?: string;
      otp?: string;
    }>();
    const username = body.username ?? "";
    const password = body.password ?? "";

    const result = await ujiLiveLogin(username, password, body.otp);
    const live = putLiveSession({
      username: result.username,
      displayName: result.displayName,
      email: `${result.username}@uji.es`,
      jar: result.jar,
      expiresAt: result.expiresAt,
      landingUrl: result.landingUrl,
    });
    try {
      const listed = await fetchListadoReservas(result.jar);
      if (listed.personaId) setLivePersonaId(live.sid, listed.personaId);
      touchLiveSession(live.sid, result.jar);
    } catch (error) {
      console.warn(
        "[uji-live] listado after login failed:",
        error instanceof Error ? error.message : "error",
      );
    }
    const user = {
      username: live.username,
      displayName: live.displayName,
      email: live.email,
    };
    const token = await createToken(user, mode, live.sid);
    c.header("Set-Cookie", sessionCookie(token));
    return c.json({
      ok: true,
      user,
      mode,
      sessionMeta: liveSessionInfo(live),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No s'ha pogut iniciar sessió.";
    console.error("[auth] login failed:", message);
    return c.json({ ok: false, error: message }, 401);
  }
});

app.delete("/api/auth", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  deleteLiveSession(session?.sid);
  c.header("Set-Cookie", clearCookie());
  return c.json({ ok: true });
});

/** Proxy authenticated calls to allow-listed uji_sports PL/SQL procedures. */
app.post("/api/uji/proxy", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);
  if (getConfiguredMode() !== "live" && session.mode !== "live") {
    return c.json({ error: tr("err.proxyLiveOnly") }, 400);
  }

  try {
    const body = await c.req.json<{
      procedure?: string;
      url?: string;
      body?: string;
      method?: string;
    }>();

    let target = body.url;
    if (!target) {
      const proc = (body.procedure ?? "").replace(/^!/, "");
      if (!/^uji_sports(\.[A-Za-z0-9_]+)+$/.test(proc)) {
        throw new Error(tr("err.badProcedure"));
      }
      target = `https://e-ujier.uji.es/pls/www/!${proc}`;
    }

    const { live, jar } = requireLiveJar(session);
    const result = await ujiAuthedRequest(jar, target, {
      method: body.method ?? "POST",
      body: body.body ?? "",
    });
    touchLiveSession(live.sid, jar);

    return c.json({
      ok: true,
      status: result.status,
      contentType: result.contentType,
      url: result.url,
      body: result.body,
      sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : tr("err.proxyFailed") },
      502,
    );
  }
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sportsInView(sportId: SportId | undefined): SportId[] {
  if (!sportId) return SPORTS.map((sport) => sport.id);
  if (sportId === "padel") return ["padel", "padelVidre"];
  return [sportId];
}

function parseBatchDates(raw: string | undefined) {
  return [
    ...new Set(
      (raw ?? "")
        .split(",")
        .map((date) => date.trim())
        .filter((date) => ISO_DATE.test(date)),
    ),
  ].slice(0, 7);
}

app.get("/api/availability/batch", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);

  const scope = c.req.query("scope") === "all" ? "all" : "sport";
  const requestedSport = c.req.query("sportId") as SportId | undefined;
  const knownSport = SPORTS.some((sport) => sport.id === requestedSport);
  const dates = parseBatchDates(c.req.query("dates"));
  if (!dates.length || (scope === "sport" && !knownSport)) {
    return c.json({ error: tr("err.sportDate") }, 400);
  }

  const sportId = scope === "sport" ? requestedSport : undefined;
  const sportIds = sportsInView(sportId);

  let liveJar: ReturnType<typeof requireLiveJar>;
  try {
    liveJar = requireLiveJar(session);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : tr("err.sessionMissing");
    return c.json({
      scope,
      sportId,
      live: false,
      needsRelogin: true,
      warning: reason,
      days: dates.map((date) => ({
        date,
        courts: [],
        slots: [],
        live: false,
        unavailable: true,
        needsRelogin: true,
        warning: reason,
        maxHours: 1.5,
        slotMinutes: 30,
      })),
    });
  }

  const { live, jar } = liveJar;
  const started = Date.now();
  let days;
  try {
    const loaded = await loadPortalAvailability(jar, dates, {
      sportId,
      personaId: live.personaId,
    });
    if (loaded.personaId) setLivePersonaId(live.sid, loaded.personaId);
    days = loaded.days.map((day) => {
      const accepted = sportsInView(sportId);
      const courts = day.courts.filter((court) => accepted.includes(court.sportId));
      const slots = day.slots.filter((slot) => accepted.includes(slot.sportId));
      if (!courts.length) {
        return {
          date: day.date,
          courts: [] as Court[],
          slots: [] as AvailabilitySlot[],
          live: false,
          unavailable: true,
          warning: undefined as string | undefined,
          needsRelogin: undefined as boolean | undefined,
          maxHours: 1.5,
          slotMinutes: 30,
          persona: loaded.personaId,
        };
      }
      return {
        date: day.date,
        courts,
        slots,
        live: true as const,
        unavailable: false,
        warning: undefined as string | undefined,
        needsRelogin: undefined as boolean | undefined,
        maxHours:
          slots.find((slot) => slot.live?.maxHours)?.live?.maxHours ?? 1.5,
        slotMinutes: 30,
        persona: loaded.personaId,
      };
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : tr("err.availability");
    const expired = reason === tr("err.sessionExpired");
    days = dates.map((date) => ({
      date,
      courts: [] as Court[],
      slots: [] as AvailabilitySlot[],
      live: false,
      unavailable: true,
      needsRelogin: expired,
      warning: expired ? reason : undefined,
      maxHours: 1.5,
      slotMinutes: 30,
      persona: undefined as string | undefined,
    }));
  }

  touchLiveSession(live.sid, jar);
  const persona = days.map((day) => day.persona).find(Boolean);
  if (persona) setLivePersonaId(live.sid, persona);
  console.log(
    `[uji-live] availability days=${dates.length} scope=${scope} ms=${Date.now() - started}`,
  );

  return c.json({
    scope,
    sportId,
    live: days.some((day) => day.live),
    warning: days.find((day) => day.warning)?.warning,
    needsRelogin: days.some((day) => day.needsRelogin),
    days: days.map(({ persona: _persona, ...day }) => day),
  });
});

app.get("/api/availability", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);

  const sportId = c.req.query("sportId") as SportId | undefined;
  const date = c.req.query("date");
  const courtId = c.req.query("courtId") || undefined;
  const resource = c.req.query("resource");

  if (getConfiguredMode() === "live" || session.mode === "live") {
    let liveJar: ReturnType<typeof requireLiveJar> | null = null;
    try {
      liveJar = requireLiveJar(session);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Sessió e-UJIer no disponible";
      // Still show local court grid so the UI is usable; prompt re-login for live.
      if (resource === "courts") {
        return c.json({
          courts: sportId
            ? COURTS.filter((x) => x.sportId === sportId)
            : COURTS,
          needsRelogin: true,
          warning: reason,
        });
      }
      if (!sportId || !date) {
        return c.json({ error: tr("err.sportDate"), needsRelogin: true }, 400);
      }
      return c.json(liveCourtsFallback(sportId, date, courtId, reason));
    }

    try {
      const { live, jar } = liveJar;
      const formBody = c.req.query("formBody") || undefined;

      if (resource === "sports" || resource === "types") {
        const tipos = await fetchReservationTypes(jar, formBody);
        touchLiveSession(live.sid, jar);
        const options = parseHtmlOptions(tipos.body);
        return c.json({
          sports: SPORTS,
          reservationTypes: options,
          rawPreview: tipos.body.slice(0, 2000),
          sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
        });
      }

      if (resource === "courts") {
        return c.json({
          courts: sportId
            ? COURTS.filter((x) => x.sportId === sportId)
            : COURTS,
          note: "Llista local de pistes; els IDs reals depenen de e-UJIer.",
        });
      }

      if (!sportId || !date) {
        return c.json({ error: tr("err.sportDate") }, 400);
      }

      const loaded = formBody
        ? null
        : await loadPortalAvailability(jar, [date], {
            sportId,
            personaId: live.personaId,
          });
      const disp = formBody
        ? await fetchDisponibilidad(jar, date, formBody, live.personaId)
        : null;
      touchLiveSession(live.sid, jar);
      if (disp && isPortalSessionDead(disp.body)) {
        return c.json(
          liveCourtsFallback(sportId, date, courtId, tr("err.sessionExpired")),
        );
      }
      const parsed = disp
        ? parseDisponibilidadHtml(disp.body)
        : {
            date,
            courts: loaded?.days[0]?.courts ?? [],
            slots: loaded?.days[0]?.slots ?? [],
          };
      if (loaded?.personaId) setLivePersonaId(live.sid, loaded.personaId);
      const personaFromSlots = parsed.slots
        .map((s) => extractPersonaId(s.live?.plsql))
        .find(Boolean);
      if (personaFromSlots) setLivePersonaId(live.sid, personaFromSlots);
      const courts = parsed.courts.filter(
        (x) => x.sportId === sportId && (!courtId || x.id === courtId),
      );
      const slots = parsed.slots.filter(
        (s) => s.sportId === sportId && (!courtId || s.courtId === courtId),
      );

      if (!parsed.courts.length) {
        return c.json({
          courts: [],
          slots: [],
          sportId,
          date,
          live: false,
          warning: tr("err.parseAvailability"),
          rawDisponiblePreview: disp?.body.slice(0, 2000),
          authError: Boolean(disp && /Error en la autenticaci/i.test(disp.body)),
          sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
        });
      }

      const maxHours =
        slots.find((s) => s.live?.maxHours)?.live?.maxHours ?? 1.5;

      return c.json({
        courts,
        slots,
        sportId,
        date: parsed.date ?? date,
        live: true,
        slotMinutes: 30,
        maxHours,
        rawDisponiblePreview: disp?.body.slice(0, 1500),
        authError: Boolean(disp && /Error en la autenticaci/i.test(disp.body)),
        sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Live unavailable";
      const expired =
        reason === tr("err.sessionExpired") || reason === tr("err.sessionMissing");
      if (!expired) {
        if (!sportId || !date) {
          return c.json({ error: reason, needsRelogin: false }, 502);
        }
        return c.json({
          courts: [],
          slots: [],
          sportId,
          date,
          live: false,
          warning: reason,
          needsRelogin: false,
        });
      }
      return c.json(liveCourtsFallback(sportId, date, courtId, reason));
    }
  }

  return c.json({ error: tr("err.liveUnavailable") }, 502);
});

app.get("/api/bookings", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);
  if (getConfiguredMode() === "live" || session.mode === "live") {
    try {
      const { live, jar } = requireLiveJar(session);
      const listed = await fetchListadoReservas(jar, live.personaId);
      if (listed.personaId) setLivePersonaId(live.sid, listed.personaId);
      touchLiveSession(live.sid, jar);
      return c.json({
        bookings: listed.bookings,
        live: true,
        sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
      });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : tr("err.liveUnavailable") },
        502,
      );
    }
  }
  return c.json({ error: tr("err.liveUnavailable") }, 502);
});

app.post("/api/bookings", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);

  const body = await c.req.json<{
    slotId?: string;
    slotIds?: string[];
    slots?: AvailabilitySlot[];
    courtName?: string;
  }>();

  if (getConfiguredMode() === "live" || session.mode === "live") {
    try {
      const { live, jar } = requireLiveJar(session);
      const slots = await resolveLiveSlots(jar, {
        slots: body.slots,
        slotIds: body.slotIds?.length
          ? body.slotIds
          : body.slotId
            ? [body.slotId]
            : [],
        courtName: body.courtName,
        personaId: live.personaId,
      });
      const result = await bookLiveSlots(jar, {
        slots,
        courtName: body.courtName,
      });
      setLivePersonaId(live.sid, result.personaId);
      touchLiveSession(live.sid, jar);
      return c.json({
        ok: true,
        booking: result.booking,
        live: true,
        sessionMeta: liveSessionInfo(getLiveSession(live.sid)),
      });
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : tr("err.bookingFailed"),
        },
        409,
      );
    }
  }

  return c.json({ error: tr("err.liveUnavailable") }, 502);
});

app.delete("/api/bookings", async (c) => {
  const session = await readSession(c.req.header("cookie"));
  if (!session) return c.json({ error: tr("err.notAuthenticated") }, 401);
  if (getConfiguredMode() === "live" || session.mode === "live") {
    try {
      const id = c.req.query("id");
      if (!id) return c.json({ error: tr("err.idRequired") }, 400);
      const { live, jar } = requireLiveJar(session);
      const listed = await fetchListadoReservas(jar, live.personaId);
      if (listed.personaId) setLivePersonaId(live.sid, listed.personaId);
      const target = listed.bookings.find((b) => b.id === id);
      if (!target) {
        return c.json({ error: tr("err.notInList") }, 404);
      }
      await cancelLiveBooking(jar, target);
      touchLiveSession(live.sid, jar);
      return c.json({
        ok: true,
        booking: { ...target, status: "cancelled" as const },
        live: true,
      });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : tr("err.cancelFailed") },
        409,
      );
    }
  }
  return c.json({ error: tr("err.liveUnavailable") }, 502);
});

if (isProd) {
  const dist = join(process.cwd(), "dist");
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", (c) => {
    const index = join(dist, "index.html");
    if (!existsSync(index)) {
      return c.text("Frontend build missing. Run npm run build.", 500);
    }
    return c.html(readFileSync(index, "utf8"));
  });
}

serve({ fetch: app.fetch, port: apiPort, hostname: "0.0.0.0" }, (info) => {
  console.log(
    `UJI Deporte listening on http://0.0.0.0:${info.port} (mode=${getConfiguredMode()})`,
  );
});

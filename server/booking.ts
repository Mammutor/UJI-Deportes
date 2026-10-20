import {
  mapFacilityToSport,
  type AvailabilitySlot,
  type Booking,
  type SportId,
} from "../shared/uji.js";
import { CookieJar } from "./cookie-jar.js";
import { tr } from "./locale.js";
import { loadPortalAvailability } from "./portal-availability.js";
import { ujiAuthedRequest } from "./uji-client.js";

export const UPDATE_SQL_URL =
  "https://e-ujier.uji.es/pls/www/!ujitreeapl2.update_sql";
export const LISTADO_RESERVAS_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.listado_reservas";
export const PINTA_BOTON_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.pinta_boton_realizar_reserva";
export const RELOJ_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.relojReservasUsuario";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;?/gi, " ");
}

/** ISO date → portal short date DD/MM/YY */
export function toPortalShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function extractPersonaId(plsql?: string | null): string | null {
  if (!plsql) return null;
  const m = plsql.match(/p_persona\s*=>\s*(\d+)/i);
  return m?.[1] ?? null;
}

function slotLabelHtml(startTime: string, endTime: string): string {
  return `${startTime}<br><div style="text-align:right; font-size:0.7em;">${endTime}</div>`;
}

function updateSqlBody(sql: string, id: string, firma: string): string {
  return new URLSearchParams({
    sql,
    id,
    firma,
    _: "",
  }).toString();
}

async function postUpdateSql(
  jar: CookieJar,
  sql: string,
  id: string,
  firma: string,
) {
  const result = await ujiAuthedRequest(jar, UPDATE_SQL_URL, {
    method: "POST",
    body: updateSqlBody(sql, id, firma),
  });
  return result;
}

function assertNoFirmaError(body: string) {
  if (/Error en firma/i.test(body)) {
    throw new Error(tr("err.firma"));
  }
  if (/Error en la autenticaci/i.test(body)) {
    throw new Error(tr("err.sessionExpired"));
  }
}

function mapCourtNameToSport(name: string): SportId {
  return mapFacilityToSport(name) ?? "other";
}

function isoFromPortalDate(raw: string): string {
  const m = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!m) return raw;
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm}-${dd}`;
}

/** Parse listado_reservas HTML into Booking[]. */
export function parseListadoReservas(html: string): Booking[] {
  const bookings: Booking[] = [];
  // Pair each cancel button with the following valor span
  const re =
    /button_action[23]\(\s*['"](\d+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"][\s\S]*?<\/div>\s*<span class="valor[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const buttonId = m[1];
    const plsql = m[2];
    const firma = m[3];
    const label = decodeHtml(m[4]).replace(/\s+/g, " ").trim();
    const info = label.match(
      /Instalaci[oó]:\s*(.+?)\s+amb codi\s+(\S+)\s+el d[ií]a:\s*(\d{2}\/\d{2}\/\d{2,4})\s+de:\s*(\d{2}:\d{2})\s+hasta\s+(\d{2}:\d{2})/i,
    );
    if (!info) continue;
    const courtName = info[1].trim();
    const code = info[2].trim();
    const date = isoFromPortalDate(info[3]);
    const startTime = info[4];
    const endTime = info[5];
    const reservaMatch = plsql.match(/p_reserva\s*=>\s*(\d+)/i);
    const reservaId = reservaMatch?.[1] ?? buttonId;
    const sportId = mapCourtNameToSport(courtName);
    bookings.push({
      id: `uji-res-${reservaId}`,
      courtId: `uji-${code}`,
      courtName,
      sportId,
      sportName: courtName,
      date,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      live: {
        reservaId,
        buttonId,
        plsql,
        firma,
        code,
      },
    });
  }
  return bookings;
}

/** Active bookings. The portal loads this with the academic year, not ppersona. */
export async function fetchListadoReservas(
  jar: CookieJar,
  personaId?: string,
) {
  const now = new Date();
  const curso =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const bodies = [
    new URLSearchParams({
      pcursoaca: String(curso),
      divid: "PanelReservasU",
      _: "",
    }).toString(),
  ];
  if (personaId) {
    bodies.push(new URLSearchParams({ ppersona: personaId, _: "" }).toString());
  }
  let result = await ujiAuthedRequest(jar, LISTADO_RESERVAS_URL, {
    method: "POST",
    body: bodies[0],
  });
  if (!/Llistat de reserves|Instalaci/i.test(result.body) && bodies[1]) {
    result = await ujiAuthedRequest(jar, LISTADO_RESERVAS_URL, {
      method: "POST",
      body: bodies[1],
    });
  }
  assertNoFirmaError(result.body);
  const persona =
    result.body.match(/p_persona\s*=>\s*(\d+)/i)?.[1] ?? personaId;
  return {
    ...result,
    bookings: parseListadoReservas(result.body),
    personaId: persona,
  };
}

type ConfirmButton = {
  sql: string;
  id: string;
  firma: string;
};

/** Load “Realitzar reserva” button after slot selection (fresh firma). */
export async function fetchRealizarReservaButton(
  jar: CookieJar,
  personaId: string,
  instalacionId: string,
): Promise<ConfirmButton> {
  const qs = new URLSearchParams({
    p_persona: personaId,
    p_instalacion: instalacionId,
  }).toString();
  const result = await ujiAuthedRequest(jar, `${PINTA_BOTON_URL}?${qs}`, {
    method: "GET",
    headers: {
      Accept: "text/javascript, text/html, */*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  // Also try POST if GET returns empty
  let html = result.body;
  if (!/button_action|pon_carrito/i.test(html)) {
    const post = await ujiAuthedRequest(jar, PINTA_BOTON_URL, {
      method: "POST",
      body: new URLSearchParams({
        p_persona: personaId,
        p_instalacion: instalacionId,
        _: "",
      }).toString(),
    });
    html = post.body;
  }

  const m = html.match(
    /button_action\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*pon_carrito[^'"]*)['"]\s*,\s*['"]([^'"]+)['"]/i,
  );
  if (!m) {
    // Sometimes firma is on a simplified onclick / boton wrapper
    const m2 = html.match(
      /button_action\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([a-f0-9]{40})['"]/i,
    );
    if (!m2 || !/pon_carrito/i.test(m2[2])) {
      throw new Error(tr("err.noConfirmButton"));
    }
    return { id: m2[1], sql: m2[2], firma: m2[3] };
  }
  return { id: m[1], sql: m[2], firma: m[3] };
}

export type LiveBookInput = {
  slots: AvailabilitySlot[];
  courtName?: string;
};

function normCourtName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function selectionTimes(input: {
  slots?: AvailabilitySlot[];
  slotIds?: string[];
}): { date: string; times: string[] } | null {
  const fromSlots = (input.slots ?? [])
    .filter((s) => s.date && s.startTime)
    .map((s) => ({ date: s.date, time: s.startTime }));
  const fromIds = (input.slotIds ?? []).flatMap((id) => {
    const parts = id.split("|");
    if (parts.length < 3) return [];
    return [{ date: parts[1], time: parts[2] }];
  });
  const picks = fromSlots.length ? fromSlots : fromIds;
  if (!picks.length) return null;
  return { date: picks[0].date, times: picks.map((p) => p.time) };
}

/**
 * Demo grids have no firma. Reload the day from e-UJIer and match court + times.
 */
export async function resolveLiveSlots(
  jar: CookieJar,
  input: {
    slots?: AvailabilitySlot[];
    slotIds?: string[];
    courtName?: string;
    personaId?: string;
  },
): Promise<AvailabilitySlot[]> {
  const given = input.slots ?? [];
  if (
    given.length &&
    given.every((s) => s.live?.plsql && s.live?.token)
  ) {
    return given;
  }

  const selection = selectionTimes(input);
  const courtName = input.courtName?.trim();
  if (!selection || !courtName) {
    throw new Error(tr("err.needSlotsPayload"));
  }

  const loaded = await loadPortalAvailability(jar, [selection.date], {
    personaId: input.personaId,
  });
  const parsed = loaded.days[0] ?? { courts: [], slots: [], blocks: [] };
  if (!parsed.courts.length) {
    throw new Error(tr("err.parseAvailability"));
  }

  const want = normCourtName(courtName);
  const block =
    parsed.blocks.find((b) => normCourtName(b.court.name) === want) ??
    parsed.blocks.find((b) => {
      const name = normCourtName(b.court.name);
      return name.endsWith(` ${want}`) || want.endsWith(` ${name}`);
    });
  if (!block) {
    throw new Error(tr("err.courtNotOnPortal", { court: courtName }));
  }

  const chosen: AvailabilitySlot[] = [];
  for (const time of selection.times) {
    const slot = block.slots.find((s) => s.startTime === time);
    if (!slot) {
      throw new Error(
        tr("err.slotNotOnPortal", { court: block.court.name, time }),
      );
    }
    if (slot.status !== "available" || !slot.live?.plsql || !slot.live.token) {
      throw new Error(
        tr("err.slotTakenLive", { court: block.court.name, time }),
      );
    }
    chosen.push(slot);
  }
  return chosen;
}

/**
 * Live booking:
 * 1) pon_parametro_reserva_usuario for each selected half-hour (with slot firma)
 * 2) pinta_boton_realizar_reserva → fresh firma
 * 3) pon_carrito confirm
 */
export async function bookLiveSlots(jar: CookieJar, input: LiveBookInput) {
  const slots = [...input.slots].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  if (!slots.length) throw new Error(tr("err.noSlots"));

  for (const s of slots) {
    if (s.status !== "available" && s.status !== "past") {
      // allow past only if somehow selected — normally blocked in UI
    }
    if (!s.live?.plsql || !s.live?.token) {
      throw new Error(tr("err.missingLiveMeta", { time: s.startTime }));
    }
  }

  const first = slots[0];
  const last = slots[slots.length - 1];
  const instalacionId = first.live!.instalacionId;
  if (slots.some((s) => s.live!.instalacionId !== instalacionId)) {
    throw new Error(tr("err.sameInstall"));
  }
  if (slots.some((s) => s.date !== first.date)) {
    throw new Error(tr("err.sameDay"));
  }

  const personaId =
    extractPersonaId(first.live!.plsql) ||
    extractPersonaId(slots.map((s) => s.live?.plsql).join(" "));
  if (!personaId) {
    throw new Error(tr("err.noPersona"));
  }

  // 1) Select each cuadro
  for (const slot of slots) {
    const sql = slot.live!.plsql!;
    const firma = slot.live!.token!;
    const id = slotLabelHtml(slot.startTime, slot.endTime);
    const res = await postUpdateSql(jar, sql, id, firma);
    assertNoFirmaError(res.body);
    if (/alert\s*\(\s*["']/i.test(res.body) && /error|no s'ha|imposible/i.test(res.body)) {
      const alertMsg = res.body.match(/alert\s*\(\s*["']([^"']+)/i)?.[1];
      throw new Error(alertMsg || tr("err.selectSlot"));
    }
  }

  // 2) Confirm button with fresh firma
  const btn = await fetchRealizarReservaButton(jar, personaId, instalacionId);

  // 3) pon_carrito
  const confirm = await postUpdateSql(jar, btn.sql, btn.id, btn.firma);
  assertNoFirmaError(confirm.body);

  const alertMsg = confirm.body.match(/alert\s*\(\s*["']([^"']+)["']/i)?.[1];
  const ok =
    /S'ha realitzat la reserva/i.test(confirm.body) ||
    /realitzat la reserva/i.test(alertMsg ?? "");
  if (!ok && /alert\s*\(/i.test(confirm.body)) {
    throw new Error(alertMsg || tr("err.notConfirmed"));
  }
  if (!ok) {
    // Some responses may succeed without alert text — check listado
    console.warn(
      "[book-live] no success alert; body preview:",
      confirm.body.slice(0, 400),
    );
  }

  // Soft refresh availability panel clock (best-effort)
  try {
    await ujiAuthedRequest(jar, RELOJ_URL, {
      method: "POST",
      body: new URLSearchParams({
        p_persona: personaId,
        p_instalacion: instalacionId,
        pprocedimiento: "reservas_disponible",
        divid: "PanelRealizarDisponibilidadU",
        _: "",
      }).toString(),
    });
  } catch {
    /* ignore */
  }

  const courtName = input.courtName ?? first.courtId;
  const booking: Booking = {
    id: `uji-pending-${instalacionId}-${first.startTime}`,
    courtId: first.courtId,
    courtName,
    sportId: first.sportId,
    sportName: courtName,
    date: first.date,
    startTime: first.startTime,
    endTime: last.endTime,
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };

  // Prefer ids from listado right after book
  try {
    const listed = await fetchListadoReservas(jar, personaId);
    const match = listed.bookings.find(
      (b) =>
        b.date === first.date &&
        b.startTime === first.startTime &&
        (b.courtName === courtName ||
          b.courtId.includes(first.live!.code) ||
          b.courtName.toLowerCase().includes(
            courtName.split(" ")[0]?.toLowerCase() ?? "",
          )),
    );
    if (match) return { booking: match, personaId, raw: confirm.body };
  } catch {
    /* keep stub */
  }

  return { booking, personaId, raw: confirm.body };
}

/** Cancel via eliminar_reserva + update_sql. */
export async function cancelLiveBooking(
  jar: CookieJar,
  booking: {
    live?: {
      plsql?: string;
      firma?: string;
      buttonId?: string;
    };
  },
) {
  const plsql = booking.live?.plsql;
  const firma = booking.live?.firma;
  const id = booking.live?.buttonId ?? "";
  if (!plsql || !firma) {
    throw new Error(tr("err.noCancelMeta"));
  }
  const res = await postUpdateSql(jar, plsql, id, firma);
  assertNoFirmaError(res.body);
  return res;
}

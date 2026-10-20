import {
  ZONES,
  type AvailabilitySlot,
  type Court,
  type ZoneId,
} from "../shared/uji.js";
import { CookieJar } from "./cookie-jar.js";
import { parseDisponibilidadHtml } from "./disponibilidad.js";
import { tr } from "./locale.js";
import { ujiAuthedRequest } from "./uji-client.js";

const UPDATE_SQL_URL =
  "https://e-ujier.uji.es/pls/www/!ujitreeapl2.update_sql";

const TIPOS_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.reservas_tipos";
const CALENDAR_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.pinta_calendario";
const DISPONIBLE_URL =
  "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.reservas_disponible";

type ParamButton = {
  id: string;
  sql: string;
  firma: string;
  label: string;
};

function cursoYear(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return String(m >= 9 ? y : y - 1);
}

function mesAnyo(iso: string) {
  const [y, m] = iso.split("-");
  return `${y}${m}`;
}

function portalDateToIso(raw: string) {
  const [d, m, y] = raw.split("/");
  if (!d || !m || !y) return raw;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m}-${d}`;
}

function extractParamButtons(html: string): ParamButton[] {
  const re =
    /button_action\d?\(\s*'(\d+)'\s*,\s*'(begin\s+uji_sports\.pon_parametro\([^']*\);\s*end;)'\s*,\s*'([a-fA-F0-9]{20,})'[^>]*>([^<]*)/gi;
  return [...html.matchAll(re)].map((match) => ({
    id: match[1],
    sql: match[2],
    firma: match[3],
    label: match[4].replace(/\s+/g, " ").trim(),
  }));
}

function paramParts(sql: string) {
  const match = sql.match(
    /pon_parametro\(\s*#([^#]+)#\s*,\s*#([^#]+)#\s*,\s*(\d+)\s*\)/i,
  );
  if (!match) return null;
  return { name: match[1], value: match[2], personaId: match[3] };
}

function pickTypes(buttons: ParamButton[], zone?: ZoneId) {
  const types = buttons.filter((button) => {
    const parts = paramParts(button.sql);
    return parts && /TI-USUARIO/i.test(parts.name);
  });
  if (!zone) return types;
  const pattern = ZONES.find((item) => item.id === zone)?.match;
  if (!pattern) return [];
  return types.filter((button) => pattern.test(button.label));
}

async function postParam(jar: CookieJar, button: ParamButton) {
  const result = await ujiAuthedRequest(jar, UPDATE_SQL_URL, {
    method: "POST",
    body: new URLSearchParams({
      sql: button.sql,
      id: button.id,
      firma: button.firma,
      _: "",
    }).toString(),
  });
  if (/Error en firma/i.test(result.body)) {
    throw new Error("firma");
  }
  return result;
}

async function fetchTipos(jar: CookieJar, iso: string) {
  const result = await ujiAuthedRequest(jar, TIPOS_URL, {
    method: "POST",
    body: new URLSearchParams({
      pcursoaca: cursoYear(iso),
      divid: "PanelRealizarTiposU",
      _: "",
      p_mesanyo: mesAnyo(iso),
    }).toString(),
  });
  return result.body;
}

async function fetchCalendar(jar: CookieJar, iso: string) {
  const result = await ujiAuthedRequest(jar, CALENDAR_URL, {
    method: "POST",
    body: new URLSearchParams({
      pcursoaca: cursoYear(iso),
      divid: "PanelReservasU",
      _: "",
      p_mesanyo: mesAnyo(iso),
    }).toString(),
  });
  return result.body;
}

function dayButton(html: string, iso: string) {
  const [y, m, d] = iso.split("-");
  const portal = `${d}/${m}/${y}`;
  return extractParamButtons(html).find((button) => {
    const parts = paramParts(button.sql);
    if (!parts || !/DIA-RESERVA/i.test(parts.name)) return false;
    return portalDateToIso(parts.value) === iso || parts.value === portal;
  });
}

async function fetchGrid(jar: CookieJar, iso: string, personaId: string) {
  const [y, m, d] = iso.split("-");
  const result = await ujiAuthedRequest(jar, DISPONIBLE_URL, {
    method: "POST",
    body: new URLSearchParams({
      p_persona: personaId,
      divid: "PanelRealizarDisponibilidadU",
      _: "",
      p_fecha: `${d}/${m}/${y}`,
    }).toString(),
  });
  return result.body;
}

/**
 * e-UJIer keeps the space type and the day in the Oracle session.
 * Select them, then read reservas_disponible. Days stay in order because
 * parallel calls would overwrite that session day.
 */
export async function loadPortalAvailability(
  jar: CookieJar,
  dates: string[],
  options: { zone?: ZoneId; personaId?: string } = {},
) {
  type ParsedBlock = ReturnType<typeof parseDisponibilidadHtml>["blocks"][number];
  const buckets = new Map<
    string,
    {
      courts: Map<string, Court>;
      slots: Map<string, AvailabilitySlot>;
      blocks: Map<string, ParsedBlock>;
    }
  >();
  for (const date of dates) {
    buckets.set(date, {
      courts: new Map(),
      slots: new Map(),
      blocks: new Map(),
    });
  }
  if (!dates.length) return { personaId: options.personaId, days: [] };

  const tiposHtml = await fetchTipos(jar, dates[0]);
  const typeButtons = pickTypes(extractParamButtons(tiposHtml), options.zone);
  let personaId =
    options.personaId ||
    typeButtons.map((button) => paramParts(button.sql)?.personaId).find(Boolean);

  for (const typeButton of typeButtons) {
    personaId = paramParts(typeButton.sql)?.personaId ?? personaId;
    try {
      await postParam(jar, typeButton);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "firma") throw error;
      const fresh = pickTypes(
        extractParamButtons(await fetchTipos(jar, dates[0])),
        options.zone,
      ).find((button) => button.label === typeButton.label);
      if (!fresh) throw new Error(tr("err.firma"));
      await postParam(jar, fresh);
    }

    const months = new Map<string, string[]>();
    for (const date of dates) {
      const key = mesAnyo(date);
      months.set(key, [...(months.get(key) ?? []), date]);
    }

    for (const monthDates of months.values()) {
      let calendarHtml = await fetchCalendar(jar, monthDates[0]);
      for (const date of monthDates) {
        let button = dayButton(calendarHtml, date);
        if (!button) continue;
        try {
          await postParam(jar, button);
        } catch (error) {
          if (!(error instanceof Error) || error.message !== "firma") throw error;
          calendarHtml = await fetchCalendar(jar, date);
          button = dayButton(calendarHtml, date);
          if (!button) continue;
          await postParam(jar, button);
        }
        if (!personaId) continue;
        const html = await fetchGrid(jar, date, personaId);
        const parsed = parseDisponibilidadHtml(html);
        const bucket = buckets.get(date);
        if (!bucket) continue;
        for (const court of parsed.courts) bucket.courts.set(court.id, court);
        for (const slot of parsed.slots) bucket.slots.set(slot.id, slot);
        for (const block of parsed.blocks) {
          bucket.blocks.set(block.court.id, block);
        }
        console.log(
          `[uji-live] grid ${date} type=${typeButton.label} courts=${parsed.courts.length} sports=${[...new Set(parsed.courts.map((court) => court.label ?? court.sportId))].join(",")}`,
        );
      }
    }
  }

  return {
    personaId,
    days: dates.map((date) => {
      const bucket = buckets.get(date);
      return {
        date,
        courts: [...(bucket?.courts.values() ?? [])],
        slots: [...(bucket?.slots.values() ?? [])],
        blocks: [...(bucket?.blocks.values() ?? [])],
      };
    }),
  };
}

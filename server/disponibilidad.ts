import type { AvailabilitySlot, Court, SportId } from "../shared/uji.js";

export type LiveCourtBlock = {
  court: Court;
  maxHours: number;
  slots: AvailabilitySlot[];
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;?/gi, " ");
}

function mapCourtNameToSport(name: string): SportId {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (n.includes("vidre")) return "padelVidre";
  if (n.includes("padel")) return "padel";
  if (n.includes("tennis") || n.includes("tenis")) return "tennis";
  if (n.includes("esquaix") || n.includes("squash")) return "squash";
  if (n.includes("pickle")) return "pickleball";
  if (n.includes("badminton") || n.includes("badmint")) return "badminton";
  if (n.includes("escalada") || n.includes("boulder")) return "escalada";
  if (n.includes("front")) return "fronto";
  if (n.includes("ironfit") || n.includes("iron")) return "ironfit";
  if (n.includes("futbol") || n.includes("football")) return "football7";
  if (n.includes("volei") || n.includes("volley")) return "volleyball";
  return "padel";
}

function parseMaxHours(comment: string): number {
  const m = comment.match(/([\d]+(?:[.,]\d+)?)/);
  if (!m) return 1.5;
  return Number(m[1].replace(",", ".")) || 1.5;
}

function isoFromPortalDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm}-${dd}`;
}

function parseSlotChunk(
  chunk: string,
  instalacionId: string,
  cuadro: string,
  court: Court,
  dateIso: string,
  maxHours: number,
  code: string,
): AvailabilitySlot | null {
  const timeMatch = chunk.match(
    /(\d{2}:\d{2})\s*<br\s*\/?>\s*[\s\S]*?(\d{2}:\d{2})/i,
  );
  if (!timeMatch) return null;
  const startTime = timeMatch[1];
  const endTime = timeMatch[2];

  const hasGreen = /background-color\s*:\s*#0f0/i.test(chunk);
  const hasRed = /background-color\s*:\s*red/i.test(chunk);

  let status: AvailabilitySlot["status"] = "blocked";
  if (hasGreen) status = "available";
  else if (hasRed) status = "booked";

  const start = new Date(`${dateIso}T${startTime}:00`);
  if (status === "available" && start < new Date()) status = "past";

  const clickId = chunk.match(
    /id=["'](\d+)["'][^>]*class=["'][^"']*click/i,
  )?.[1];
  const actionMatch = chunk.match(
    /button_action\(\s*['"](\d+)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]/i,
  );

  return {
    id: `uji-${instalacionId}-${cuadro}-${startTime}`,
    courtId: court.id,
    sportId: court.sportId,
    date: dateIso,
    startTime,
    endTime,
    status,
    live: {
      instalacionId,
      cuadro,
      code,
      maxHours,
      buttonId: actionMatch?.[1] ?? clickId,
      plsql: actionMatch?.[2],
      token: actionMatch?.[3],
    },
  };
}

/**
 * Parse e-UJIer reservas_disponible HTML into courts + 30-minute slots.
 * Red cells = booked; green (#0f0) clickable cells = available.
 */
export function parseDisponibilidadHtml(html: string): {
  date: string | null;
  courts: Court[];
  slots: AvailabilitySlot[];
  blocks: LiveCourtBlock[];
} {
  const dateMatch = html.match(
    /titulo14B[^>]*>\s*(\d{2}\/\d{2}\/\d{2,4})\s*</i,
  );
  const dateIso = dateMatch ? isoFromPortalDate(dateMatch[1]) : null;

  const blocks: LiveCourtBlock[] = [];
  const courtSections = html.split(/<div class="texto2">/i).slice(1);

  for (const section of courtSections) {
    const nameMatch = section.match(
      /titulo10B[^>]*>\s*([^<]+?)\s*<span[^>]*class=["']comentario["'][^>]*>([^<]*)<\/span>/i,
    );
    if (!nameMatch) continue;
    const name = decodeHtml(nameMatch[1]).trim();
    const maxHours = parseMaxHours(decodeHtml(nameMatch[2]));
    const codeMatch = section.match(/titulo10 italic[^>]*>\s*([^<]+)\s*</i);
    const code = codeMatch ? decodeHtml(codeMatch[1]).trim() : name;

    const instalacionMatch = section.match(/CUADRO_HORA_RES_INST_(\d+)_/i);
    const instalacionId = instalacionMatch?.[1] ?? code;
    const sportId = mapCourtNameToSport(name);
    const court: Court = {
      id: `uji-${instalacionId}`,
      name,
      code,
      sportId,
      indoor:
        /PC$/i.test(code) ||
        /interior|esquaix|badminton|ironfit|escalada/i.test(name),
    };

    if (!dateIso) {
      blocks.push({ court, maxHours, slots: [] });
      continue;
    }

    const markers: { instalacionId: string; cuadro: string; index: number }[] =
      [];
    const idRe = /id=["']CUADRO_HORA_RES_INST_(\d+)_(\d+)["']/gi;
    let im: RegExpExecArray | null;
    while ((im = idRe.exec(section))) {
      markers.push({
        instalacionId: im[1],
        cuadro: im[2],
        index: im.index,
      });
    }

    const slots: AvailabilitySlot[] = [];
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      const end = i + 1 < markers.length ? markers[i + 1].index : section.length;
      const chunk = section.slice(m.index, end);
      const slot = parseSlotChunk(
        chunk,
        m.instalacionId,
        m.cuadro,
        court,
        dateIso,
        maxHours,
        code,
      );
      if (slot) slots.push(slot);
    }

    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    blocks.push({ court, maxHours, slots });
  }

  return {
    date: dateIso,
    courts: blocks.map((b) => b.court),
    slots: blocks.flatMap((b) => b.slots),
    blocks,
  };
}

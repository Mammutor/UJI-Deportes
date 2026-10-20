import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MapPin, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBooking,
  fetchAvailabilityBatch,
  logout,
  maxHalfHourBlocks,
  SPORTS,
  ZONES,
  type AvailabilityDay,
  type AvailabilityScope,
  type AvailabilitySlot,
  type Court,
  type ZoneId,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  dateLocale,
  sportNameKey,
  type Locale,
  type MessageKey,
} from "../../shared/i18n";

function isoToday() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function addDaysIso(base: string, days: number) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(iso: string, locale: Locale) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(
    dateLocale(locale),
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    },
  );
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function areConsecutive(a: AvailabilitySlot, b: AvailabilitySlot) {
  return (
    a.courtId === b.courtId &&
    a.date === b.date &&
    Math.abs(toMinutes(a.startTime) - toMinutes(b.startTime)) === 30
  );
}

const ZONE_KEY: Record<ZoneId, MessageKey> = {
  rackets: "zone.rackets",
  pavilion: "zone.pavilion",
  outdoor: "zone.outdoor",
  table: "zone.table",
};

function groupKey(court: Court) {
  return court.label ?? court.sportId;
}

type LoadMode = "day" | "week" | "dayAll" | "weekAll";

const LOAD_MODES: {
  id: LoadMode;
  label:
    | "courts.loadDay"
    | "courts.loadWeek"
    | "courts.loadDayAll"
    | "courts.loadWeekAll";
}[] = [
  { id: "day", label: "courts.loadDay" },
  { id: "week", label: "courts.loadWeek" },
  { id: "dayAll", label: "courts.loadDayAll" },
  { id: "weekAll", label: "courts.loadWeekAll" },
];

function isWeekMode(mode: LoadMode) {
  return mode === "week" || mode === "weekAll";
}

function isAllSports(mode: LoadMode) {
  return mode === "dayAll" || mode === "weekAll";
}

type DayCache = {
  key: string;
  byDate: Record<string, AvailabilityDay>;
};

export function CourtBrowser() {
  const { t, locale } = useI18n();
  const [zoneId, setZoneId] = useState<ZoneId>("rackets");
  const [date, setDate] = useState(isoToday());
  const [mode, setMode] = useState<LoadMode>("day");
  const [cache, setCache] = useState<DayCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysIso(isoToday(), i)),
    [],
  );
  const allSports = isAllSports(mode);
  const loadKey = [
    mode,
    isWeekMode(mode) ? dates.join(",") : date,
    allSports ? "all" : zoneId,
  ].join("|");
  const activeCache = cache?.key === loadKey ? cache : null;
  const preferredDate = useRef(date);
  preferredDate.current = date;
  const ready = Boolean(activeCache);
  const day = activeCache?.byDate[date];
  const dayIsOpen = (iso: string) => {
    const entry = activeCache?.byDate[iso];
    if (!entry || entry.unavailable) return false;
    return entry.courts.length > 0 || entry.slots.length > 0;
  };
  const courts = day?.courts ?? [];
  const slots = day?.slots ?? [];
  const needsRelogin = Boolean(day?.needsRelogin);
  const waitingForDay = !day;
  const maxHours =
    slots.find((slot) => slot.live?.maxHours)?.live?.maxHours ?? 1.5;
  const maxBlocks = maxHalfHourBlocks(maxHours);

  useEffect(() => {
    let stale = false;
    const scope: AvailabilityScope = isAllSports(mode) ? "all" : "zone";
    const week = isWeekMode(mode);
    const target = preferredDate.current;
    // One day per request. A full week of every sport can run for minutes,
    // and Cloudflare closes a single response at about 100 seconds.
    const queue = week ? [target, ...dates.filter((iso) => iso !== target)] : [target];
    const key = loadKey;
    setLoading(true);
    setError(null);
    setProgress({ done: 0, total: queue.length });
    setCache({ key, byDate: {} });

    void (async () => {
      const byDate: Record<string, AvailabilityDay> = {};
      let message: string | null = null;
      for (let i = 0; i < queue.length; i++) {
        if (stale) return;
        setProgress({ done: i, total: queue.length });
        try {
          const data = await fetchAvailabilityBatch({
            dates: [queue[i]],
            scope,
            zone: scope === "zone" ? zoneId : undefined,
          });
          if (stale) return;
          for (const entry of data.days ?? []) byDate[entry.date] = entry;
          setCache({ key, byDate: { ...byDate } });
          if (data.days?.some((entry) => entry.needsRelogin)) break;
        } catch (e) {
          if (stale) return;
          message = e instanceof Error ? e.message : "Error";
          break;
        }
      }
      if (stale) return;
      setError(message);
      setProgress(null);
      setLoading(false);
    })();

    return () => {
      stale = true;
    };
  }, [loadKey, dates, mode, zoneId]);

  useEffect(() => {
    if (!isWeekMode(mode) || !ready || dayIsOpen(date)) return;
    const next = dates.find((iso) => dayIsOpen(iso));
    if (next) setDate(next);
  }, [ready, date, dates, zoneId, mode, cache]);

  useEffect(() => {
    setSelectedIds([]);
  }, [date, zoneId, mode]);

  const byCourt = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const court of courts) map.set(court.id, []);
    for (const slot of slots) {
      const list = map.get(slot.courtId) ?? [];
      list.push(slot);
      map.set(slot.courtId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [courts, slots]);

  const courtGroups = useMemo(() => {
    const order = new Map(SPORTS.map((item, index) => [item.id, index]));
    const keys: string[] = [];
    for (const court of courts) {
      const key = groupKey(court);
      if (!keys.includes(key)) keys.push(key);
    }
    keys.sort((a, b) => {
      const ia = order.get(a as (typeof SPORTS)[number]["id"]) ?? 1000;
      const ib = order.get(b as (typeof SPORTS)[number]["id"]) ?? 1000;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b, dateLocale(locale));
    });
    return keys.map((key) => ({
      id: key,
      courts: courts.filter((court) => groupKey(court) === key),
    }));
  }, [courts, locale]);

  const selectedSlots = useMemo(() => {
    const set = new Set(selectedIds);
    return slots
      .filter((s) => set.has(s.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedIds]);

  const selectionSummary = useMemo(() => {
    if (!selectedSlots.length) return null;
    const court = courts.find((c) => c.id === selectedSlots[0].courtId);
    return {
      courtName: court?.name ?? "Pista",
      start: selectedSlots[0].startTime,
      end: selectedSlots[selectedSlots.length - 1].endTime,
      count: selectedSlots.length,
    };
  }, [selectedSlots, courts]);

  function toggleSlot(slot: AvailabilitySlot) {
    if (slot.status !== "available") return;

    setSelectedIds((prev) => {
      const existing = slots
        .filter((s) => prev.includes(s.id))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Deselect if already selected — drop from this slot onward.
      if (prev.includes(slot.id)) {
        return existing
          .filter((s) => toMinutes(s.startTime) < toMinutes(slot.startTime))
          .map((s) => s.id);
      }

      // Different court or empty → start new selection.
      if (!existing.length || existing[0].courtId !== slot.courtId) {
        return [slot.id];
      }

      const first = existing[0];
      const last = existing[existing.length - 1];

      // Extend contiguous range only (before first or after last).
      const extendsBefore =
        areConsecutive(slot, first) &&
        toMinutes(slot.startTime) < toMinutes(first.startTime);
      const extendsAfter =
        areConsecutive(last, slot) &&
        toMinutes(slot.startTime) > toMinutes(last.startTime);

      if (!extendsBefore && !extendsAfter) {
        return [slot.id];
      }

      const next = extendsBefore
        ? [slot, ...existing]
        : [...existing, slot];

      const capHours = slot.live?.maxHours ?? 1.5;
      const cap = maxHalfHourBlocks(capHours);
      if (next.length > cap) {
        toast.message(t("courts.maxToast", { hours: capHours, blocks: cap }));
        return prev;
      }
      return next.map((s) => s.id);
    });
  }

  async function confirmBooking() {
    if (!selectedSlots.length) return;
    setBooking(true);
    try {
      const courtName =
        courts.find((c) => c.id === selectedSlots[0].courtId)?.name ??
        undefined;
      const b = await createBooking({
        slotIds: selectedSlots.map((s) => s.id),
        slots: selectedSlots,
        courtName,
      });
      toast.success(
        t("courts.bookedToast", {
          court: b.courtName,
          date: b.date,
          start: b.startTime,
          end: b.endTime,
        }),
      );
      setConfirmOpen(false);
      setSelectedIds([]);
      const bookedDate = selectedSlots[0]?.date ?? date;
      const refreshed = await fetchAvailabilityBatch({
        dates: [bookedDate],
        scope: allSports ? "all" : "zone",
        zone: allSports ? undefined : zoneId,
      });
      const entry =
        refreshed.days?.find((day) => day.date === bookedDate) ??
        refreshed.days?.[0];
      if (entry) {
        setCache((prev) =>
          prev
            ? { ...prev, byDate: { ...prev.byDate, [bookedDate]: entry } }
            : prev,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("courts.bookError"));
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[2rem] font-normal leading-10 text-[color:var(--uji-ink)]">
              {t("courts.title")}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--uji-ink)]/60">
              <MapPin className="size-3.5" />
              {allSports
                ? t("courts.metaAll")
                : t("courts.meta", {
                    zone: t(ZONE_KEY[zoneId]),
                    hours: maxHours,
                  })}
            </p>
          </div>
          {allSports ? null : (
            <select
              className="md-field w-full text-sm sm:w-64"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value as ZoneId)}
            >
              {ZONES.map((id) => (
                <option key={id} value={id}>
                  {t(ZONE_KEY[id])}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {LOAD_MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
              className="md-chip"
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <p className="text-sm text-[color:var(--uji-ink)]/70">{t("courts.slowNotice")}</p>

        <div className="flex flex-wrap gap-2">
          {dates.map((d) => {
            const known = Boolean(activeCache?.byDate[d]);
            const closed = known && !dayIsOpen(d);
            return (
              <button
                key={d}
                type="button"
                disabled={closed}
                title={closed ? t("courts.unavailable") : undefined}
                onClick={() => setDate(d)}
                aria-pressed={!closed && d === date}
                className="md-chip"
              >
                {formatDayLabel(d, locale)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--uji-ink)]/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[color:var(--uji-court)]" />
            {t("courts.free")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[color:var(--uji-red)]" />
            {t("courts.booked")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-[color:var(--md-outline)] bg-[color:var(--md-surface-highest)]" />
            {t("courts.unavailable")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[color:var(--uji-orange)]" />
            {t("courts.selected")}
          </span>
          <span className="text-[color:var(--uji-ink)]/40">
            {t("courts.hint", { blocks: maxBlocks })}
          </span>
        </div>
      </div>

      {needsRelogin ? (
        <div className="md-banner md-banner-warning flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">{t("courts.sessionFallback")}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={async () => {
              await logout();
              window.location.assign("/login");
            }}
          >
            {t("courts.relogin")}
          </Button>
        </div>
      ) : null}

      {waitingForDay ? (
        error && !loading ? (
          <div className="md-banner md-banner-error p-6">{error}</div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center text-[color:var(--uji-ink)]/55">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              {progress
                ? t("courts.loadingProgress", {
                    current: progress.done + 1,
                    total: progress.total,
                  })
                : t("courts.loading")}
            </div>
            <p>{t("courts.slowNotice")}</p>
          </div>
        )
      ) : courts.length === 0 ? (
        <div className="space-y-4">
          {progress ? (
            <div className="flex items-center gap-2 text-sm text-[color:var(--uji-ink)]/60">
              <Loader2 className="size-4 animate-spin" />
              {t("courts.loadingProgress", {
                current: progress.done + 1,
                total: progress.total,
              })}{" "}
              {t("courts.slowNotice")}
            </div>
          ) : null}
          <div className="md-surface-1 p-10 text-center text-[color:var(--uji-ink)]/55">
            {error ?? t("courts.unavailable")}
          </div>
        </div>
      ) : (
        <div className="space-y-5 pb-24">
          {progress ? (
            <div className="flex items-center gap-2 text-sm text-[color:var(--uji-ink)]/60">
              <Loader2 className="size-4 animate-spin" />
              {t("courts.loadingProgress", {
                current: progress.done + 1,
                total: progress.total,
              })}{" "}
              {t("courts.slowNotice")}
            </div>
          ) : null}
          {courtGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              <h2 className="text-xl font-medium text-[color:var(--uji-ink)]">
                {group.courts[0]?.label ??
                  t(sportNameKey(group.courts[0]?.sportId ?? "other"))}
              </h2>
              {group.courts.map((court) => {
            const courtSlots = byCourt.get(court.id) ?? [];
            return (
              <section
                key={court.id}
                className="md-card p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-medium text-[color:var(--uji-ink)]">
                      {court.name}
                    </h2>
                    {court.code ? (
                      <p className="text-xs italic text-[color:var(--uji-ink)]/45">
                        {court.code}
                      </p>
                    ) : null}
                  </div>
                  <Badge>
                    {court.indoor ? t("courts.indoor") : t("courts.outdoor")}
                  </Badge>
                </div>
                {courtSlots.length === 0 ? (
                  <p className="text-sm text-[color:var(--uji-ink)]/35">
                    {t("courts.unavailable")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {courtSlots.map((slot) => {
                      const available = slot.status === "available";
                      const selected = selectedIds.includes(slot.id);
                      const booked = slot.status === "booked";
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!available}
                          onClick={() => toggleSlot(slot)}
                          title={
                            booked
                              ? t("courts.alreadyBooked")
                              : available
                                ? `${slot.startTime}–${slot.endTime}`
                                : slot.status
                          }
                          className={[
                            "md-slot",
                            selected
                              ? "md-slot-selected"
                              : available
                                ? "md-slot-free"
                                : booked
                                  ? "md-slot-booked"
                                  : "md-slot-closed",
                          ].join(" ")}
                        >
                          <div className="font-medium tabular-nums leading-tight">
                            {slot.startTime}
                          </div>
                          <div className="text-[0.65rem] tabular-nums opacity-85">
                            {slot.endTime}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
              })}
            </div>
          ))}
        </div>
      )}

      {selectionSummary ? (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white px-4 py-3 shadow-[var(--md-elevation-8)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[color:var(--uji-ink)]">
              <span className="font-medium">{selectionSummary.courtName}</span>
              {" · "}
              <span className="tabular-nums">
                {selectionSummary.start}–{selectionSummary.end}
              </span>
              <span className="text-[color:var(--uji-ink)]/55">
                {" "}
                ({selectionSummary.count} × 30 min)
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                <X className="size-4" />
                {t("courts.clear")}
              </Button>
              <Button size="sm" onClick={() => setConfirmOpen(true)}>
                {t("courts.book")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("courts.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {selectionSummary
                ? `${selectionSummary.courtName} · ${date} · ${selectionSummary.start}–${selectionSummary.end}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-[color:var(--uji-ink)]/65">
            {t("courts.confirmLive", {
              count: selectedSlots.length,
              hours:
                selectedSlots.find((slot) => slot.live?.maxHours)?.live
                  ?.maxHours ?? maxHours,
            })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("courts.cancel")}
            </Button>
            <Button onClick={confirmBooking} disabled={booking}>
              {booking ? <Loader2 className="animate-spin" /> : <Check />}
              {t("courts.book")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

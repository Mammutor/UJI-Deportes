import { useEffect, useMemo, useState } from "react";
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
  type AvailabilityDay,
  type AvailabilitySlot,
  type SportId,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { sportNameKey, zoneKeyForSport, type Locale } from "../../shared/i18n";

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
    locale === "en" ? "en-GB" : "ca-ES",
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

function sportsInView(sportId: SportId): SportId[] {
  if (sportId === "padel") return ["padel", "padelVidre"];
  return [sportId];
}

type DayCache = {
  key: string;
  byDate: Record<string, AvailabilityDay>;
};

export function CourtBrowser() {
  const { t, locale } = useI18n();
  const [sportId, setSportId] = useState<SportId>("padel");
  const [date, setDate] = useState(isoToday());
  const [cache, setCache] = useState<DayCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysIso(isoToday(), i)),
    [],
  );
  const visibleSports = SPORTS.filter((sport) => sport.id !== "padelVidre");
  const sport = SPORTS.find((s) => s.id === sportId) ?? SPORTS[0];
  const shownSports = useMemo(() => sportsInView(sportId), [sportId]);
  const datesKey = dates.join(",");
  const cacheKey = `${datesKey}|${sportId}`;
  const activeCache = cache?.key === cacheKey ? cache : null;
  const ready = Boolean(activeCache);
  const day = activeCache?.byDate[date];
  const dayIsOpen = (iso: string) => {
    const entry = activeCache?.byDate[iso];
    if (!entry || entry.unavailable) return false;
    return entry.slots.some((slot) => shownSports.includes(slot.sportId));
  };
  const courts = useMemo(
    () =>
      (day?.courts ?? []).filter((court) => shownSports.includes(court.sportId)),
    [day, shownSports],
  );
  const slots = useMemo(
    () =>
      (day?.slots ?? []).filter((slot) => shownSports.includes(slot.sportId)),
    [day, shownSports],
  );
  const needsRelogin = Boolean(
    activeCache &&
      dates.every((iso) => activeCache.byDate[iso]?.needsRelogin),
  );
  const maxHours =
    slots.find((slot) => slot.live?.maxHours)?.live?.maxHours ?? sport.maxHours;
  const maxBlocks = maxHalfHourBlocks(maxHours);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await fetchAvailabilityBatch({
          dates,
          scope: "sport",
          sportId,
        });
        if (stale) return;
        const byDate: Record<string, AvailabilityDay> = {};
        for (const entry of data.days ?? []) byDate[entry.date] = entry;
        setCache({ key: cacheKey, byDate });
      } catch (e) {
        if (stale) return;
        setError(e instanceof Error ? e.message : "Error");
        setCache(null);
      } finally {
        if (!stale) setLoading(false);
      }
    })();
    return () => {
      stale = true;
    };
  }, [cacheKey, dates, sportId]);

  useEffect(() => {
    if (!ready || dayIsOpen(date)) return;
    const next = dates.find((iso) => dayIsOpen(iso));
    if (next) setDate(next);
  }, [ready, date, dates, sportId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [date, sportId]);

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

      if (next.length > maxBlocks) {
        toast.message(
          t("courts.maxToast", { hours: maxHours, blocks: maxBlocks }),
        );
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
        scope: "sport",
        sportId,
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
            <h1 className="font-heading text-3xl tracking-tight text-[color:var(--uji-ink)] sm:text-4xl">
              {t("courts.title")}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--uji-ink)]/60">
              <MapPin className="size-3.5" />
              {t("courts.meta", {
                zone: t(zoneKeyForSport(sport.id)),
                hours: maxHours,
              })}
            </p>
          </div>
          <select
            className="h-10 w-full rounded-lg border border-[color:var(--uji-ink)]/15 bg-white/80 px-3 text-sm sm:w-56"
            value={sportId}
            onChange={(e) => setSportId(e.target.value as SportId)}
          >
            {visibleSports.map((s) => (
              <option key={s.id} value={s.id}>
                {t(sportNameKey(s.id))}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1">
          {dates.map((d) => {
            const closed = ready && !dayIsOpen(d);
            return (
              <button
                key={d}
                type="button"
                disabled={closed}
                title={closed ? t("courts.unavailable") : undefined}
                onClick={() => setDate(d)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm transition",
                  closed
                    ? "cursor-not-allowed border-transparent bg-[color:var(--uji-ink)]/10 text-[color:var(--uji-ink)]/35"
                    : d === date
                      ? "border-[color:var(--uji-orange)] bg-white text-[color:var(--uji-ink)]"
                      : "border-transparent bg-white/50 text-[color:var(--uji-ink)]/70 hover:bg-white",
                ].join(" ")}
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
            <span className="size-3 rounded-sm bg-red-500/80" />
            {t("courts.booked")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[color:var(--uji-ink)]/20" />
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
        <div className="flex flex-col gap-3 rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[color:var(--uji-ink)]/55">
          <Loader2 className="size-5 animate-spin" />
          {t("courts.loadingDays", { count: dates.length })}
        </div>
      ) : error && courts.length === 0 ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : courts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--uji-ink)]/15 bg-[color:var(--uji-ink)]/5 p-10 text-center text-[color:var(--uji-ink)]/45">
          {t("courts.unavailable")}
        </div>
      ) : (
        <div className="space-y-5 pb-24">
          {courts.map((court) => {
            const courtSlots = byCourt.get(court.id) ?? [];
            return (
              <section
                key={court.id}
                className="rounded-2xl border border-[color:var(--uji-ink)]/8 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-lg text-[color:var(--uji-ink)]">
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
                            "min-w-[4.5rem] rounded-md px-2.5 py-2 text-left text-sm transition",
                            selected
                              ? "bg-[color:var(--uji-orange)] text-white ring-2 ring-[color:var(--uji-orange)]/40"
                              : available
                                ? "bg-[color:var(--uji-court)] text-white hover:brightness-110 active:scale-[0.98]"
                                : booked
                                  ? "cursor-not-allowed bg-red-500/75 text-white/95"
                                  : "cursor-not-allowed bg-[color:var(--uji-ink)]/8 text-[color:var(--uji-ink)]/35",
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
      )}

      {selectionSummary ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--uji-ink)]/10 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
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
              hours: maxHours,
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

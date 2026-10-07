import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelBooking, listBookings, type Booking } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function BookingsList() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await listBookings());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bookings.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel(id: string) {
    setPendingId(id);
    try {
      await cancelBooking(id);
      toast.success(t("bookings.cancelled"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("bookings.error"));
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[color:var(--uji-ink)]/55">
        <Loader2 className="animate-spin" />
        {t("bookings.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--uji-ink)]/20 bg-white/50 p-12 text-center">
        <p className="font-heading text-xl text-[color:var(--uji-ink)]">
          {t("bookings.emptyTitle")}
        </p>
        <p className="mt-2 text-sm text-[color:var(--uji-ink)]/60">
          {t("bookings.emptyBody")}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="flex flex-col gap-3 rounded-2xl border border-[color:var(--uji-ink)]/8 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg text-[color:var(--uji-ink)]">
                {b.courtName}
              </h2>
              <Badge>{b.sportName}</Badge>
            </div>
            <p className="mt-1 text-sm text-[color:var(--uji-ink)]/60 tabular-nums">
              {b.date} · {b.startTime}–{b.endTime}
              {b.live?.code ? ` · ${b.live.code}` : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(b.id)}
            disabled={pendingId === b.id}
          >
            {pendingId === b.id ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            {t("bookings.cancel")}
          </Button>
        </li>
      ))}
    </ul>
  );
}

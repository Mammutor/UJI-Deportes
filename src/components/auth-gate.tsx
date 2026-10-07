import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchSession, type SessionInfo } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function useSessionLoader() {
  const { t } = useI18n();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSession()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : t("login.apiDown"),
          );
          setSession({
            authenticated: false,
            user: null,
            mode: "live",
            configuredMode: "live",
            endpoints: {
              bookingEntry: "https://e-ujier.uji.es/pls/www/!uji_sports.usuari",
              infoPage:
                "https://www.uji.es/esports/base/instalacions/reservas-prestec/",
            },
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return { session, loading, error, setSession };
}

export function AuthGate({
  requireAuth,
}: {
  requireAuth: boolean;
}) {
  const { session, loading, error } = useSessionLoader();
  const { t } = useI18n();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-[color:var(--uji-ink)]/55">
        <Loader2 className="animate-spin" />
        {t("app.loading")}
      </div>
    );
  }

  if (error && !session?.authenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-3 px-4 py-16">
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
        <p className="text-sm text-[color:var(--uji-ink)]/65">
          {t("login.apiHint")}
        </p>
      </div>
    );
  }

  if (requireAuth && !session?.authenticated) {
    // Soft redirect — do not scare the login form with a cookie-failure message.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!requireAuth && session?.authenticated) {
    return <Navigate to="/courts" replace />;
  }

  return <Outlet context={{ session }} />;
}

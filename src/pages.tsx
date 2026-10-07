import { Link, useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/app-header";
import { CourtBrowser } from "@/components/court-browser";
import { BookingsList } from "@/components/bookings-list";
import { LoginForm } from "@/components/login-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/language-toggle";
import { UJI_ENDPOINTS, type SessionInfo } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

function useSession() {
  return useOutletContext<{ session: SessionInfo | null }>().session!;
}

export function LoginPage() {
  const { t } = useI18n();

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle tone="light" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[color:var(--uji-court)]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[color:var(--uji-orange)]/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="animate-rise mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[color:var(--uji-orange)] font-heading text-2xl font-bold text-[color:var(--uji-ink)] shadow-md">
            U
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-[color:var(--uji-ink)] sm:text-5xl">
            UJI Deporte
          </h1>
          <p className="mt-2 text-base text-[color:var(--uji-ink)]/65">
            {t("app.subtitle")}
          </p>
        </div>
        <div className="animate-rise-delay rounded-2xl border border-[color:var(--uji-ink)]/10 bg-white/85 p-6 shadow-sm backdrop-blur">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-[color:var(--uji-ink)]/55">
          {t("app.officialInfo")}{" "}
          <a
            className="underline underline-offset-2"
            href={UJI_ENDPOINTS.infoPage}
            target="_blank"
            rel="noreferrer"
          >
            {t("app.officialLink")}
          </a>
        </p>
      </div>
    </main>
  );
}

export function CourtsPage() {
  const session = useSession();
  return (
    <>
      <AppHeader displayName={session.user!.displayName} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <CourtBrowser />
      </main>
    </>
  );
}

export function BookingsPage() {
  const session = useSession();
  const { t } = useI18n();
  return (
    <>
      <AppHeader displayName={session.user!.displayName} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl tracking-tight text-[color:var(--uji-ink)] sm:text-4xl">
              {t("app.myBookings")}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--uji-ink)]/60">
              {t("bookings.subtitle")}
            </p>
          </div>
          <Link
            to="/courts"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("bookings.new")}
          </Link>
        </div>
        <BookingsList />
      </main>
    </>
  );
}

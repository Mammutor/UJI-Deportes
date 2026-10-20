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
    <main className="relative flex flex-1 flex-col bg-[color:var(--md-surface)]">
      <div className="brand-stripe" />
      <div className="absolute right-4 top-6 z-10">
        <LanguageToggle tone="light" />
      </div>
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pt-16 pb-12">
        <div className="animate-rise mb-6 text-center">
          <img
            src={`${import.meta.env.BASE_URL}uji-logo.jpg`}
            alt="Universitat Jaume I"
            className="mx-auto mb-5 h-auto w-full max-w-xs"
          />
          <h1 className="text-3xl font-normal leading-tight text-[color:var(--uji-ink)]">
            {t("app.title")}
          </h1>
          <p className="mt-1 text-base text-[color:var(--uji-ink)]/70">
            {t("app.subtitle")}
          </p>
        </div>
        <div className="animate-rise-delay md-surface-2 p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-[color:var(--uji-ink)]/60">
          {t("app.officialInfo")}{" "}
          <a
            className="font-medium text-[color:var(--md-primary)] underline-offset-2 hover:underline"
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
            <h1 className="text-[2rem] font-normal leading-10 text-[color:var(--uji-ink)]">
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

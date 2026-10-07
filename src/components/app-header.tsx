import { Link } from "react-router-dom";
import { CalendarDays, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/language-toggle";
import { logout } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Props = {
  displayName: string;
};

export function AppHeader({ displayName }: Props) {
  const { t } = useI18n();

  async function onLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color:var(--uji-ink)]/90 text-white backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          to="/courts"
          className="flex items-center gap-2 font-heading text-lg tracking-tight"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-[color:var(--uji-orange)] font-bold text-[color:var(--uji-ink)]">
            U
          </span>
          <span>
            UJI <span className="font-normal text-white/80">Deporte</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/bookings"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white hover:bg-white/10 hover:text-white",
            )}
          >
            <CalendarDays />
            <span className="hidden sm:inline">{t("nav.bookings")}</span>
          </Link>
          <LanguageToggle />
          <span className="hidden max-w-[10rem] truncate text-sm text-white/70 sm:inline">
            {displayName}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            className="bg-white/15 text-white hover:bg-white/25"
          >
            <LogOut />
            {t("app.logout")}
          </Button>
        </nav>
      </div>
    </header>
  );
}

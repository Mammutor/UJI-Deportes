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

const logoSrc = `${import.meta.env.BASE_URL}uji-logo.jpg`;

export function AppHeader({ displayName }: Props) {
  const { t } = useI18n();

  async function onLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--md-primary)] text-white shadow-[var(--md-elevation-4)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/courts" className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 shrink-0 items-center rounded-lg bg-white px-1.5 shadow-[var(--md-elevation-1)]">
            <img
              src={logoSrc}
              alt="Universitat Jaume I"
              className="h-6 w-auto sm:h-7"
            />
          </span>
          <span className="hidden min-w-0 truncate text-lg font-medium tracking-normal md:inline">
            {t("app.title")}
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/bookings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <CalendarDays />
            <span className="hidden sm:inline">{t("nav.bookings")}</span>
          </Link>
          <LanguageToggle />
          <span className="hidden max-w-[10rem] truncate text-sm text-white/80 sm:inline">
            {displayName}
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut />
            {t("app.logout")}
          </Button>
        </nav>
      </div>
      <div className="brand-stripe" />
    </header>
  );
}

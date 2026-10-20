import { Languages } from "lucide-react";
import { LOCALES } from "../../shared/i18n";
import { useI18n } from "@/lib/i18n";

type Props = {
  tone?: "dark" | "light";
};

export function LanguageToggle({ tone = "dark" }: Props) {
  const { locale, setLocale, t } = useI18n();
  const dark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className={[
        "inline-flex h-8 items-center gap-0.5 rounded-full p-0.5 text-xs font-medium",
        dark ? "bg-white/15" : "bg-[color:var(--md-surface-highest)]",
      ].join(" ")}
    >
      <Languages
        className={[
          "ml-1.5 hidden size-3.5 sm:block",
          dark ? "text-white/80" : "text-[color:var(--md-primary)]",
        ].join(" ")}
        aria-hidden
      />
      {LOCALES.map((code) => {
        const active = locale === code;
        const name =
          code === "es" ? t("lang.es") : code === "en" ? t("lang.en") : t("lang.va");
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={name}
            title={name}
            onClick={() => setLocale(code)}
            className={[
              "h-7 rounded-full px-2 uppercase tracking-wide transition-[background-color,box-shadow,color] duration-200",
              active
                ? dark
                  ? "bg-white text-[color:var(--md-primary)] shadow-[var(--md-elevation-1)]"
                  : "bg-[color:var(--md-primary)] text-white shadow-[var(--md-elevation-1)]"
                : dark
                  ? "text-white/80 hover:text-white"
                  : "text-[color:var(--uji-ink)]/70 hover:text-[color:var(--uji-ink)]",
            ].join(" ")}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

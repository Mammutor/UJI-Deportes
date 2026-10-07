import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "../../shared/i18n";
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
        "inline-flex items-center gap-0.5 rounded-lg border p-0.5 text-xs font-medium",
        dark
          ? "border-white/20 bg-white/10"
          : "border-[color:var(--uji-ink)]/15 bg-white/80",
      ].join(" ")}
    >
      <Languages
        className={[
          "ml-1 size-3.5",
          dark ? "text-white/70" : "text-[color:var(--uji-ink)]/50",
        ].join(" ")}
        aria-hidden
      />
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(code as Locale)}
            className={[
              "rounded-md px-2 py-1 uppercase tracking-wide transition",
              active
                ? dark
                  ? "bg-white text-[color:var(--uji-ink)]"
                  : "bg-[color:var(--uji-ink)] text-white"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-[color:var(--uji-ink)]/55 hover:text-[color:var(--uji-ink)]",
            ].join(" ")}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  htmlLang,
  parseLocale,
  t,
  type Locale,
  type MessageKey,
} from "../../shared/i18n";

const STORAGE_KEY = "uji-locale";

function initialLocale(): Locale {
  try {
    const saved = parseLocale(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    /* private mode */
  }
  const nav = parseLocale(
    typeof navigator !== "undefined" ? navigator.language : null,
  );
  if (nav) return nav;
  // German browsers land on English (no de catalog).
  if (
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("de")
  ) {
    return "en";
  }
  return "va";
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = htmlLang(locale);
    document.title = t(locale, "app.title");
  }, [locale]);

  // Stable identity so data loaders that list `t` as a dependency do not
  // refetch when the language changes.
  const translate = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      t(localeRef.current, key, vars),
    [],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: translate,
    }),
    [locale, translate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}

export function readClientLocale(): Locale {
  try {
    return parseLocale(localStorage.getItem(STORAGE_KEY)) ?? "va";
  } catch {
    return "va";
  }
}

import { AsyncLocalStorage } from "node:async_hooks";
import {
  parseLocale,
  t,
  type Locale,
  type MessageKey,
} from "../shared/i18n.js";

const als = new AsyncLocalStorage<Locale>();

export function currentLocale(): Locale {
  return als.getStore() ?? "ca";
}

export function tr(
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  return t(currentLocale(), key, vars);
}

export async function withRequestLocale(
  header: string | undefined,
  fn: () => Promise<void>,
) {
  const locale = parseLocale(header) ?? "ca";
  await als.run(locale, fn);
}

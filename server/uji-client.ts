import { CookieJar } from "./cookie-jar.js";
import { tr } from "./locale.js";
import { UJI_ENDPOINTS } from "../shared/uji.js";

const UA = "UJI-Deporte/0.1 (+personal booking helper)";
const MAX_HOPS = 16;

/** SimpleSAMLSessionID Max-Age observed from IdP. */
export const UJI_SSO_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export type UjiLiveLoginResult = {
  jar: CookieJar;
  username: string;
  displayName: string;
  expiresAt: number;
  landingUrl: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1] ? decodeHtml(m[1]) : null;
}

function abs(base: string, href: string) {
  return new URL(href, base).toString();
}

function isRedirect(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function request(
  jar: CookieJar,
  url: string,
  init: RequestInit = {},
): Promise<{ res: Response; url: string; body: string }> {
  const headers = new Headers(init.headers);
  headers.set("User-Agent", UA);
  const cookie = jar.headerFor(url);
  if (cookie) headers.set("Cookie", cookie);
  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    );
  }

  const res = await fetch(url, { ...init, headers, redirect: "manual" });
  jar.absorb(res, url);
  const body = await res.text();
  return { res, url, body };
}

async function follow(
  jar: CookieJar,
  startUrl: string,
  init?: RequestInit,
): Promise<{ url: string; body: string; status: number }> {
  let url = startUrl;
  let lastInit = init;
  for (let i = 0; i < MAX_HOPS; i++) {
    const { res, body } = await request(jar, url, lastInit);
    lastInit = undefined;

    if (isRedirect(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(tr("err.redirectNoLocation", { url }));
      url = abs(url, loc);
      continue;
    }

    const autoForm = extractAutoSubmitForm(body);
    if (autoForm) {
      url = abs(url, autoForm.action);
      lastInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: new URL(url).origin,
          Referer: url,
        },
        body: autoForm.body,
      };
      continue;
    }

    return { url, body, status: res.status };
  }
  throw new Error(tr("err.tooManyRedirects"));
}

function extractAutoSubmitForm(html: string): { action: string; body: string } | null {
  if (!/SAMLResponse/i.test(html)) return null;
  const action =
    pick(html, /<form[^>]*action=["']([^"']+)["'][^>]*>/i) ||
    pick(html, /action=["']([^"']+)["']/i);
  const saml =
    pick(html, /name=["']SAMLResponse["'][^>]*value=["']([^"']*)["']/i) ||
    pick(html, /value=["']([^"']*)["'][^>]*name=["']SAMLResponse["']/i) ||
    pick(
      html,
      /<textarea[^>]*name=["']SAMLResponse["'][^>]*>([\s\S]*?)<\/textarea>/i,
    );
  if (!action || saml == null) return null;
  const relay =
    pick(html, /name=["']RelayState["'][^>]*value=["']([^"']*)["']/i) ||
    pick(html, /value=["']([^"']*)["'][^>]*name=["']RelayState["']/i) ||
    pick(
      html,
      /<textarea[^>]*name=["']RelayState["'][^>]*>([\s\S]*?)<\/textarea>/i,
    ) ||
    "";
  const body = new URLSearchParams({
    SAMLResponse: saml.trim(),
    ...(relay ? { RelayState: relay.trim() } : {}),
  });
  return { action, body: body.toString() };
}

function extractLoginForm(html: string, pageUrl: string) {
  const action =
    pick(html, /<form[^>]*id=["']login-form["'][^>]*action=["']([^"']+)["']/i) ||
    pick(html, /<form[^>]*action=["']([^"']+)["'][^>]*id=["']login-form["']/i);
  const authState =
    pick(html, /name=["']AuthState["'][^>]*value=["']([^"']+)["']/i) ||
    pick(html, /value=["']([^"']+)["'][^>]*name=["']AuthState["']/i);
  if (!action || !authState) {
    throw new Error(tr("err.ssoForm"));
  }
  return {
    action: abs(pageUrl, action),
    authState,
  };
}

function looksLikeLoginPage(html: string) {
  return (
    /id=["']login-form["']/i.test(html) ||
    /name=["']userName["']/i.test(html) ||
    /Inici de sessi[oó]|Login - SSO/i.test(html)
  );
}

function loginFailed(html: string) {
  return /credencials incorrectes|usuario o contrase[nñ]a|usuari o contrasenya|authentication failed|Error d'autenticaci|Error de autenticaci/i.test(
    html,
  );
}

function extractDisplayName(html: string, username: string) {
  const fromWelcome =
    pick(html, /Benvingut\/da[,:\s]+([^<\n]+)/i) ||
    pick(html, /Bienvenid[oa][,:\s]+([^<\n]+)/i) ||
    pick(html, /Welcome[,:\s]+([^<\n]+)/i);
  return (fromWelcome || username).trim();
}

/**
 * Log in to UJI SimpleSAMLphp with university credentials and obtain
 * e-UJIer cookies needed for sports booking XHRs.
 */
function isSecondFactorPage(html: string) {
  return /twofactorauth|Doble factor|pick_method|mètodes disponibles/i.test(html);
}

/** Empty XHR or the portal's expired-session banner — not a court grid. */
export function isPortalSessionDead(html: string) {
  const text = html.trim();
  if (!text) return false;
  return (
    /Sessi[oó] expirada/i.test(text) ||
    /Error en la autenticaci/i.test(text) ||
    isSecondFactorPage(text)
  );
}

function decodeFormValue(value: string) {
  return decodeHtml(value.replace(/&amp;/g, "&"));
}

function findTotpEntry(html: string) {
  const decoded = html.replace(/&amp;/g, "&");
  return (
    decoded.match(
      /showTrustDialog\(\s*this\s*,\s*['"]([^'"]*methodName=totp[^'"]*)['"]/i,
    )?.[1] ||
    decoded.match(/['"]([^'"]*TwoFactorMethods\/pick_method\.php[^'"]*methodName=totp[^'"]*)['"]/i)?.[1] ||
    null
  );
}

function inputAttrs(tag: string) {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([:\w-]+)=["']([^"']*)["']/g)) {
    attrs[match[1].toLowerCase()] = decodeFormValue(match[2]);
  }
  return attrs;
}

async function submitTotp(
  jar: CookieJar,
  html: string,
  pageUrl: string,
  otp: string,
) {
  const href = findTotpEntry(html);
  if (!href) throw new Error(tr("err.needsSecondFactor"));
  const totpPage = await follow(jar, abs(pageUrl, href));
  const formHtml = totpPage.body;
  const formTag = formHtml.match(/<form\b[^>]*>/i)?.[0] ?? "";
  const form = inputAttrs(formTag);
  const action = form.action || totpPage.url;
  const fields = new URLSearchParams();
  for (const tag of formHtml.match(/<input\b[^>]*>/gi) ?? []) {
    const attrs = inputAttrs(tag);
    if (!attrs.name) continue;
    const type = (attrs.type ?? "text").toLowerCase();
    if (type === "submit" || type === "checkbox" || type === "button") continue;
    if (type === "hidden" && attrs.name !== "code") {
      fields.set(attrs.name, attrs.value ?? "");
    }
  }
  const digits = otp.replace(/\D/g, "");
  if (digits.length < 6) throw new Error(tr("err.badOtp"));
  fields.set("code", digits);
  console.log(
    `[uji-live] totp post path=${safePath(abs(totpPage.url, action))} fields=${[...fields.keys()].join(",")}`,
  );
  const posted = await follow(jar, abs(totpPage.url, action), {
    method: (form.method || "POST").toUpperCase() === "GET" ? "GET" : "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://xmlrpc.uji.es",
      Referer: totpPage.url,
    },
    body: fields.toString(),
  });
  if (isSecondFactorPage(posted.body)) {
    throw new Error(tr("err.badOtp"));
  }
  return posted;
}

function safePath(value: string) {
  try {
    return new URL(value).pathname;
  } catch {
    return "unknown";
  }
}

export async function ujiLiveLogin(
  username: string,
  password: string,
  otp?: string,
): Promise<UjiLiveLoginResult> {
  const user = username.trim();
  const pass = password;
  if (user.length < 4) {
    throw new Error(tr("err.userShort"));
  }
  if (pass.length < 8) {
    throw new Error(tr("err.passShort"));
  }

  const jar = new CookieJar();
  console.log(`[uji-live] SSO start for ${user.toLowerCase()}`);
  const first = await follow(jar, UJI_ENDPOINTS.bookingEntry);
  console.log(`[uji-live] login page path=${safePath(first.url)}`);

  if (!looksLikeLoginPage(first.body)) {
    // Already authenticated somehow — unusual for a fresh jar.
    if (/uji_sports|reserva/i.test(first.body) && first.url.includes("e-ujier")) {
      return finishLiveLogin(jar, user, first.body, first.url);
    }
  }

  const form = extractLoginForm(first.body, first.url);
  const body = new URLSearchParams({
    AuthState: form.authState,
    userName: user,
    password: pass,
    login: "1",
  });

  const afterLogin = await follow(jar, form.action, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://xmlrpc.uji.es",
      Referer: first.url,
    },
    body,
  });
  console.log(
    `[uji-live] after password post path=${safePath(afterLogin.url)} status=${afterLogin.status}`,
  );

  if (looksLikeLoginPage(afterLogin.body) || loginFailed(afterLogin.body)) {
    throw new Error(tr("err.badCredentials"));
  }

  // Finish the second factor on this IdP page before opening e-UJIer again.
  let landed = afterLogin;
  if (isSecondFactorPage(landed.body)) {
    if (!otp?.trim()) throw new Error(tr("err.needsSecondFactor"));
    landed = await submitTotp(jar, landed.body, landed.url, otp.trim());
  }

  if (
    !/e-ujier\.uji\.es/i.test(landed.url) ||
    !jar.get("JSESSIONID") ||
    looksLikeLoginPage(landed.body)
  ) {
    landed = await follow(jar, UJI_ENDPOINTS.bookingEntry);
    console.log(`[uji-live] booking entry path=${safePath(landed.url)}`);
  }

  if (isSecondFactorPage(landed.body)) {
    if (!otp?.trim()) throw new Error(tr("err.needsSecondFactor"));
    landed = await submitTotp(jar, landed.body, landed.url, otp.trim());
    if (!/e-ujier\.uji\.es/i.test(landed.url)) {
      landed = await follow(jar, UJI_ENDPOINTS.bookingEntry);
    }
  }

  if (looksLikeLoginPage(landed.body) || loginFailed(landed.body)) {
    throw new Error(tr("err.ssoIncomplete"));
  }
  if (isSecondFactorPage(landed.body)) {
    throw new Error(tr("err.badOtp"));
  }
  if (!jar.get("JSESSIONID") && !/e-ujier\.uji\.es/i.test(landed.url)) {
    throw new Error(tr("err.noJsession"));
  }

  return finishLiveLogin(jar, user, landed.body, landed.url);
}

function finishLiveLogin(
  jar: CookieJar,
  user: string,
  html: string,
  landingUrl: string,
): UjiLiveLoginResult {
  const username = user.toLowerCase();
  console.log(`[uji-live] OK ${username} path=${safePath(landingUrl)}`);
  return {
    jar,
    username,
    displayName: extractDisplayName(html, user),
    expiresAt: Math.min(
      jar.maxExpiresAt(UJI_SSO_MAX_AGE_MS),
      Date.now() + UJI_SSO_MAX_AGE_MS,
    ),
    landingUrl,
  };
}

export type UjiProxyResult = {
  status: number;
  contentType: string;
  body: string;
  url: string;
};

const ALLOWED_HOSTS = new Set(["e-ujier.uji.es", "xmlrpc.uji.es"]);

export function assertAllowedUjiUrl(url: string) {
  const u = new URL(url);
  if (!ALLOWED_HOSTS.has(u.hostname)) {
    throw new Error(tr("err.hostDenied", { host: u.hostname }));
  }
  if (u.protocol !== "https:") throw new Error(tr("err.httpsOnly"));
}

/** Authenticated call to an e-UJIer / SSO URL using stored cookies. */
export async function ujiAuthedRequest(
  jar: CookieJar,
  url: string,
  init: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    referer?: string;
  } = {},
): Promise<UjiProxyResult> {
  assertAllowedUjiUrl(url);
  const method = init.method ?? (init.body != null ? "POST" : "GET");
  const headers: Record<string, string> = {
    Accept: "text/javascript, text/html, application/xml, text/xml, */*",
    "X-Requested-With": "XMLHttpRequest",
    "X-Prototype-Version": "1.5.0_rc1",
    Origin: "https://e-ujier.uji.es",
    Referer: init.referer ?? UJI_ENDPOINTS.bookingEntry,
    ...init.headers,
  };
  if (init.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] =
      "application/x-www-form-urlencoded; charset=UTF-8";
  }

  let currentUrl = url;
  let currentInit: RequestInit | undefined = {
    method,
    headers,
    body: init.body,
  };
  let lastStatus = 0;
  let lastType = "text/html";
  let body = "";

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    assertAllowedUjiUrl(currentUrl);
    const { res, body: text, url: reqUrl } = await request(
      jar,
      currentUrl,
      currentInit,
    );
    lastStatus = res.status;
    lastType = res.headers.get("content-type") || "text/html";
    body = text;
    currentInit = undefined;

    if (isRedirect(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) break;
      currentUrl = abs(reqUrl, loc);
      continue;
    }

    const autoForm = extractAutoSubmitForm(body);
    if (autoForm) {
      currentUrl = abs(reqUrl, autoForm.action);
      currentInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: new URL(currentUrl).origin,
          Referer: reqUrl,
        },
        body: autoForm.body,
      };
      continue;
    }

    break;
  }

  if (/Error en la autenticaci/i.test(body) || looksLikeLoginPage(body)) {
    throw new Error(tr("err.sessionExpired"));
  }

  return {
    status: lastStatus,
    contentType: lastType,
    body,
    url: currentUrl,
  };
}

export const UJI_SPORTS_ENDPOINTS = {
  bookingEntry: UJI_ENDPOINTS.bookingEntry,
  reservationTypes:
    "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.reservas_tipos",
  availability:
    "https://e-ujier.uji.es/pls/www/!uji_sports.reservas_usuario.reservas_disponible",
  poolOccupancy: UJI_ENDPOINTS.poolOccupancy,
} as const;

/**
 * Default body for reservas_tipos (from browser DevTools payload).
 * Example captured: pcursoaca=2026&divid=PanelRealizarTiposU&_=&p_mesanyo=202610
 */
export function defaultReservasTiposBody(when = new Date()): string {
  const year = when.getFullYear();
  const month = String(when.getMonth() + 1).padStart(2, "0");
  return new URLSearchParams({
    pcursoaca: String(year),
    divid: "PanelRealizarTiposU",
    _: "",
    p_mesanyo: `${year}${month}`,
  }).toString();
}

/** Call reservas_tipos (body must match what the portal sends). */
export async function fetchReservationTypes(
  jar: CookieJar,
  formBody?: string,
) {
  const body =
    formBody?.trim() ||
    process.env.UJI_RESERVAS_TIPOS_BODY?.trim() ||
    defaultReservasTiposBody();
  return ujiAuthedRequest(jar, UJI_SPORTS_ENDPOINTS.reservationTypes, {
    method: "POST",
    body,
  });
}

function disponibilidadParams(
  isoDate: string,
  personaId: string | undefined,
  dateStyle: "full" | "short" | "none",
): string {
  const [y, m, d] = isoDate.split("-");
  const params: Record<string, string> = {
    divid: "PanelRealizarDisponibilidadU",
    _: "",
  };
  if (personaId) params.p_persona = personaId;
  if (dateStyle === "full") params.p_fecha = `${d}/${m}/${y}`;
  if (dateStyle === "short") params.p_fecha = `${d}/${m}/${y.slice(2)}`;
  return new URLSearchParams(params).toString();
}

/** Body for reservas_disponible — override with UJI_RESERVAS_DISPONIBLE_BODY. */
export function defaultReservasDisponibleBody(
  isoDate: string,
  personaId?: string,
): string {
  return disponibilidadParams(isoDate, personaId, "full");
}

function hasCourtGrid(html: string) {
  return /CUADRO_HORA_RES_INST_/i.test(html);
}

/** Date format that last returned a court grid, reused by parallel day loads. */
let knownDisponibilidadStyle: "full" | "short" | "none" | null = null;

/** Portal shells answer with updateDiv(...) instead of the grid. */
function updateDivDisponible(html: string): string | null {
  const m = html.match(
    /updateDiv\(\s*["'][^"']*["']\s*,\s*["']([^"']*reservas_disponible[^"']*)["']\s*,\s*["']([^"']*)["']/i,
  );
  if (!m) return null;
  return m[2].replace(/^\?/, "");
}

async function postDisponibilidad(jar: CookieJar, body: string) {
  let result = await ujiAuthedRequest(jar, UJI_SPORTS_ENDPOINTS.availability, {
    method: "POST",
    body,
  });
  for (let hop = 0; hop < 3 && !hasCourtGrid(result.body); hop++) {
    const next = updateDivDisponible(result.body);
    if (!next) break;
    result = await ujiAuthedRequest(jar, UJI_SPORTS_ENDPOINTS.availability, {
      method: "POST",
      body: next,
    });
  }
  return result;
}

/** Call reservas_disponible for a calendar day (DD/MM/YYYY in body). */
export async function fetchDisponibilidad(
  jar: CookieJar,
  isoDate: string,
  formBody?: string,
  personaId?: string,
) {
  const fromEnv = process.env.UJI_RESERVAS_DISPONIBLE_BODY?.trim();
  const done = (result: UjiProxyResult) => {
    if (!hasCourtGrid(result.body) && isPortalSessionDead(result.body)) {
      throw new Error(tr("err.sessionExpired"));
    }
    return result;
  };
  if (formBody?.trim()) {
    return done(await postDisponibilidad(jar, formBody.trim()));
  }
  if (fromEnv) {
    const [y, m, d] = isoDate.split("-");
    const body = fromEnv
      .replaceAll("{date}", `${d}/${m}/${y}`)
      .replaceAll("{dateShort}", `${d}/${m}/${y.slice(2)}`)
      .replaceAll("{iso}", isoDate)
      .replaceAll("{persona}", personaId ?? "");
    return done(await postDisponibilidad(jar, body));
  }

  const styles = ["full", "short", "none"] as const;
  const order = knownDisponibilidadStyle
    ? [
        knownDisponibilidadStyle,
        ...styles.filter((style) => style !== knownDisponibilidadStyle),
      ]
    : [...styles];
  let last: UjiProxyResult | null = null;
  for (const style of order) {
    if (last && hasCourtGrid(last.body)) break;
    last = await postDisponibilidad(
      jar,
      disponibilidadParams(isoDate, personaId, style),
    );
    if (hasCourtGrid(last.body)) {
      knownDisponibilidadStyle = style;
      break;
    }
  }
  return done(last!);
}

/** Best-effort parse of HTML option/list markup into {id,name}[]. */
export function parseHtmlOptions(html: string): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  const re =
    /<option[^>]*value=["']([^"']+)["'][^>]*>([^<]*)<\/option>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const id = m[1].trim();
    const name = decodeHtml(m[2]).trim();
    if (!id || id === "0" || !name) continue;
    out.push({ id, name });
  }
  if (out.length) return out;

  const li =
    /data-(?:tipo|id)=["']([^"']+)["'][^>]*>([^<]{1,80})/gi;
  while ((m = li.exec(html))) {
    out.push({ id: m[1].trim(), name: decodeHtml(m[2]).trim() });
  }
  return out;
}

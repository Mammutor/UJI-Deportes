export type Locale = "ca" | "en";

export const LOCALES: Locale[] = ["ca", "en"];

const ca = {
  "lang.label": "Idioma",
  "lang.ca": "Català",
  "lang.en": "English",

  "app.subtitle": "Reserva pàdel i altres pistes del Servei d'Esports.",
  "app.officialInfo": "Info oficial:",
  "app.officialLink": "Reserves i utilització",
  "app.sportsService": "Servei d'Esports · UJI",
  "app.myBookings": "Les meues reserves",
  "app.logout": "Eixir",
  "app.loading": "Carregant…",

  "login.user": "Usuari UJI",
  "login.password": "Contrasenya",
  "login.otp": "Codi de verificació",
  "login.otpHint": "Google Authenticator, si UJI el demana.",
  "login.submit": "Entrar",
  "login.connecting": "Connectant amb UJI…",
  "login.sessionError": "Error de sessió",
  "login.mockTitle": "Mode demo (mock)",
  "login.mockBody":
    "Usa demo / demo. Canvia UJI_MODE=live per iniciar sessió amb les teues credencials UJI (proxy al servidor).",
  "login.liveTitle": "SSO UJI",
  "login.liveBody":
    "Les credencials només s'usen al servidor; no es guarden.",
  "login.slowNotice": "Pot trigar fins a 5 minuts.",
  "login.apiDown": "No s'ha pogut contactar amb l'API (/api/auth).",
  "login.apiHint":
    "Comprova que pnpm dev té l'API a :4322 i Vite a :4321, i recarrega.",

  "nav.bookings": "Les meues reserves",
  "bookings.subtitle": "Reserves actives a e-UJIer.",
  "bookings.new": "Nova reserva",
  "bookings.loading": "Carregant reserves…",
  "bookings.emptyTitle": "Encara no tens reserves",
  "bookings.emptyBody": "No hi ha reserves actives al portal.",
  "bookings.cancel": "Cancel·lar",
  "bookings.cancelled": "Reserva cancel·lada",
  "bookings.error": "Error",

  "courts.title": "Reserves",
  "courts.meta": "{{zone}} · franges de 30 min · màx. {{hours}} h seguides",
  "courts.live": "en viu",
  "courts.free": "Lliure",
  "courts.booked": "Reservat",
  "courts.unavailable": "Sense informació",
  "courts.selected": "Seleccionat",
  "courts.hint": "Clica franges verdes consecutives (fins a {{blocks}})",
  "courts.loading": "Carregant disponibilitat…",
  "courts.loadingDays": "Carregant {{count}} dies alhora…",
  "courts.loadingProgress": "Dia {{current}} de {{total}}.",
  "courts.slowNotice": "Pot trigar fins a 5 minuts.",
  "courts.loadDay": "Un dia",
  "courts.loadWeek": "Setmana sencera",
  "courts.loadDayAll": "Un dia, tots els esports",
  "courts.loadWeekAll": "Setmana sencera, tots els esports",
  "courts.metaAll": "Tots els esports · franges de 30 min",
  "courts.scopeSport": "Aquest esport",
  "courts.scopeAll": "Tots els esports",
  "courts.none": "No hi ha pistes per a aquest esport.",
  "courts.closed": "Tancat aquest dia.",
  "courts.indoor": "Interior",
  "courts.outdoor": "Exterior",
  "courts.alreadyBooked": "Ja reservat",
  "courts.clear": "Netejar",
  "courts.book": "Reservar",
  "courts.confirmTitle": "Confirmar reserva",
  "courts.cancel": "Cancel·lar",
  "courts.confirmLive":
    "Es confirmarà a e-UJIer: {{count}} franja(es) de 30 min (màx. {{hours}} h).",
  "courts.confirmMock":
    "Se seleccionaran {{count}} franges de 30 min (màx. {{hours}} h).",
  "courts.maxToast": "Màxim {{hours}} h ({{blocks}} franges de 30 min)",
  "courts.bookedToast": "Reservat {{court}} · {{date}} {{start}}–{{end}}",
  "courts.bookError": "Error en la reserva",
  "courts.sessionTitle": "Sessió e-UJIer no disponible",
  "courts.sessionFallback":
    "Cal tornar a iniciar sessió per obtindre dades reals.",
  "courts.sessionDemo":
    "Mentrestant es mostren les pistes locals (disponibilitat demo).",
  "courts.relogin": "Tornar a entrar",

  "sport.padel": "Pàdel",
  "sport.padelVidre": "Pàdel Vidre",
  "sport.tennis": "Tenis",
  "sport.squash": "Esquaix",
  "sport.pickleball": "Pickleball",
  "sport.badminton": "Bàdminton",
  "sport.escalada": "Escalada/Boulder",
  "sport.fronto": "Frontó",
  "sport.ironfit": "Ironfit",
  "sport.football7": "Futbol 7",
  "sport.volleyball": "Vòlei platja",

  "zone.rackets": "Zona de raquetes",
  "zone.pavilion": "Pavelló",
  "zone.outdoor": "Zona d'aire lliure",

  "err.userShort": "L'usuari UJI ha de tenir almenys 4 caràcters.",
  "err.passShort": "La contrasenya UJI ha de tenir almenys 8 caràcters.",
  "err.badCredentials":
    "Credencials UJI incorrectes o cal un segon factor (Cl@ve).",
  "err.ssoIncomplete": "La sessió SSO no ha completat l'accés a e-UJIer.",
  "err.noJsession":
    "No s'ha obtingut JSESSIONID d'e-UJIer. El login SSO no s'ha completat.",
  "err.ssoForm": "No s'ha trobat el formulari SSO UJI (AuthState).",
  "err.tooManyRedirects": "Massa redireccions en el flux SSO UJI.",
  "err.redirectNoLocation": "Redirect sense Location des de {{url}}",
  "err.hostDenied": "Host no permès al proxy: {{host}}",
  "err.httpsOnly": "Només HTTPS.",
  "err.sessionExpired": "Sessió e-UJIer caducada. Torna a iniciar sessió.",
  "err.needsSecondFactor":
    "UJI demana un segon factor. Escriu el codi de Google Authenticator i torna a entrar.",
  "err.badOtp": "El codi de verificació no és vàlid.",
  "err.sessionMissing":
    "Sessió e-UJIer no trobada (caducada o reinici del servidor). Torna a iniciar sessió.",
  "err.demoCredentials":
    "Introdueix usuari i contrasenya UJI.",
  "err.demoWrong": "Credencials incorrectes (mode demo). Prova demo / demo.",
  "err.needSlot": "Cal seleccionar almenys una franja.",
  "err.badSlot": "Franja invàlida.",
  "err.sameCourt": "Totes les franges han de ser de la mateixa pista i dia.",
  "err.courtMissing": "Pista no trobada.",
  "err.maxHours":
    "Màxim {{hours}} hores seguides ({{blocks}} blocs de 30 min).",
  "err.consecutive": "Les franges han de ser consecutives.",
  "err.occupied": "Aquesta franja ja està ocupada.",
  "err.bookingMissing": "Reserva no trobada.",
  "err.cannotCancel": "No pots cancel·lar aquesta reserva.",
  "err.firma":
    "Firma e-UJIer rebutjada (caducada o incorrecta). Torna a carregar la disponibilitat i prova de nou.",
  "err.noConfirmButton":
    "No s'ha trobat el botó «Realitzar reserva» (firma). Torna a seleccionar les franges.",
  "err.noSlots": "Cap franja seleccionada.",
  "err.missingLiveMeta":
    "Falta metadata live (sql/firma) per a {{time}}. Torna a carregar disponibilitat.",
  "err.sameInstall": "Totes les franges han de ser de la mateixa instal·lació.",
  "err.sameDay": "Totes les franges han de ser del mateix dia.",
  "err.noPersona": "No s'ha pogut obtindre p_persona de la franja.",
  "err.selectSlot": "Error en seleccionar la franja.",
  "err.notConfirmed": "La reserva no s'ha confirmat.",
  "err.noCancelMeta": "Aquesta reserva no té dades de cancel·lació e-UJIer.",
  "err.needSlotsPayload":
    "Cal enviar les franges completes (slots amb metadata live) per reservar.",
  "err.courtNotOnPortal":
    "No s'ha trobat «{{court}}» a la disponibilitat d'e-UJIer.",
  "err.slotNotOnPortal":
    "No s'ha trobat {{court}} a les {{time}} a e-UJIer.",
  "err.slotTakenLive":
    "{{court}} a les {{time}} ja està ocupada a e-UJIer. La graella era de demostració; torna a carregar el dia.",
  "err.needPersonaList":
    "Obri primer «Reserves» per carregar disponibilitat (cal p_persona).",
  "err.needPersona": "Falta p_persona; carrega disponibilitat abans.",
  "err.notInList": "Reserva no trobada al llistat e-UJIer.",
  "err.parseAvailability":
    "No s'ha pogut interpretar la disponibilitat d'e-UJIer. Es mostren dades demo. Revisa UJI_RESERVAS_DISPONIBLE_BODY si cal.",
  "err.proxyLiveOnly": "Proxy només en mode live",
  "err.notAuthenticated": "No autenticat",
  "err.proxyFailed": "El proxy ha fallat",
  "err.liveUnavailable": "e-UJIer no disponible",
  "err.bookingFailed": "La reserva ha fallat",
  "err.cancelFailed": "No s'ha pogut cancel·lar",
  "err.sportDate": "Cal esport i data",
  "err.slotRequired": "Cal una franja",
  "err.idRequired": "Cal un identificador",
  "err.badProcedure":
    "procedure ha de ser tipus uji_sports.reservas_usuario.reservas_tipos",
  "err.emptyBody": "Resposta buida de l'API",
  "err.emptyHttp": "Error HTTP {{status}} (resposta buida)",
  "err.notJson":
    "L'API no ha tornat JSON (HTTP {{status}}). És possible que el proxy Vite no arribe a :4322.",
  "err.loginHttp": "El login ha fallat (HTTP {{status}})",
  "err.cookieMissing":
    "El servidor ha acceptat el login però la cookie de sessió no s'ha desat. Recarrega la pàgina i torna-ho a provar.",
  "err.availability": "Error de disponibilitat",
  "err.bookingsList": "Error en carregar les reserves",
} as const;

export type MessageKey = keyof typeof ca;

const en: { [K in MessageKey]: string } = {
  "lang.label": "Language",
  "lang.ca": "Catalan",
  "lang.en": "English",

  "app.subtitle": "Book padel and other courts at the UJI Sports Service.",
  "app.officialInfo": "Official info:",
  "app.officialLink": "Bookings and use",
  "app.sportsService": "Sports Service · UJI",
  "app.myBookings": "My bookings",
  "app.logout": "Log out",
  "app.loading": "Loading…",

  "login.user": "UJI username",
  "login.password": "Password",
  "login.otp": "Verification code",
  "login.otpHint": "Google Authenticator, if UJI asks for it.",
  "login.submit": "Sign in",
  "login.connecting": "Connecting to UJI…",
  "login.sessionError": "Session error",
  "login.mockTitle": "Demo mode (mock)",
  "login.mockBody":
    "Use demo / demo. Set UJI_MODE=live to sign in with your UJI credentials (server-side proxy).",
  "login.liveTitle": "UJI SSO",
  "login.liveBody":
    "Credentials are used only on the server and are not stored.",
  "login.slowNotice": "This can take up to 5 minutes.",
  "login.apiDown": "Could not reach the API (/api/auth).",
  "login.apiHint":
    "Check that pnpm dev has the API on :4322 and Vite on :4321, then reload.",

  "nav.bookings": "My bookings",
  "bookings.subtitle": "Active bookings on e-UJIer.",
  "bookings.new": "New booking",
  "bookings.loading": "Loading bookings…",
  "bookings.emptyTitle": "You have no bookings yet",
  "bookings.emptyBody": "There are no active bookings on the portal.",
  "bookings.cancel": "Cancel",
  "bookings.cancelled": "Booking cancelled",
  "bookings.error": "Error",

  "courts.title": "Bookings",
  "courts.meta": "{{zone}} · 30 min slots · max {{hours}} h in a row",
  "courts.live": "live",
  "courts.free": "Free",
  "courts.booked": "Booked",
  "courts.unavailable": "No information",
  "courts.selected": "Selected",
  "courts.hint": "Click consecutive green slots (up to {{blocks}})",
  "courts.loading": "Loading availability…",
  "courts.loadingDays": "Loading {{count}} days at once…",
  "courts.loadingProgress": "Day {{current}} of {{total}}.",
  "courts.slowNotice": "This can take up to 5 minutes.",
  "courts.loadDay": "One day",
  "courts.loadWeek": "Full week",
  "courts.loadDayAll": "One day, all sports",
  "courts.loadWeekAll": "Full week, all sports",
  "courts.metaAll": "All sports · 30 min slots",
  "courts.scopeSport": "This sport",
  "courts.scopeAll": "All sports",
  "courts.none": "No courts for this sport.",
  "courts.closed": "Closed this day.",
  "courts.indoor": "Indoor",
  "courts.outdoor": "Outdoor",
  "courts.alreadyBooked": "Already booked",
  "courts.clear": "Clear",
  "courts.book": "Book",
  "courts.confirmTitle": "Confirm booking",
  "courts.cancel": "Cancel",
  "courts.confirmLive":
    "This will be confirmed on e-UJIer: {{count}} × 30 min slot(s) (max {{hours}} h).",
  "courts.confirmMock":
    "{{count}} × 30 min slots will be booked (max {{hours}} h).",
  "courts.maxToast": "Maximum {{hours}} h ({{blocks}} × 30 min slots)",
  "courts.bookedToast": "Booked {{court}} · {{date}} {{start}}–{{end}}",
  "courts.bookError": "Booking error",
  "courts.sessionTitle": "e-UJIer session unavailable",
  "courts.sessionFallback": "Sign in again to load live data.",
  "courts.sessionDemo": "Showing local demo courts until then.",
  "courts.relogin": "Sign in again",

  "sport.padel": "Padel",
  "sport.padelVidre": "Padel glass",
  "sport.tennis": "Tennis",
  "sport.squash": "Squash",
  "sport.pickleball": "Pickleball",
  "sport.badminton": "Badminton",
  "sport.escalada": "Climbing / boulder",
  "sport.fronto": "Fronton",
  "sport.ironfit": "Ironfit",
  "sport.football7": "Football 7",
  "sport.volleyball": "Beach volleyball",

  "zone.rackets": "Racket zone",
  "zone.pavilion": "Pavilion",
  "zone.outdoor": "Outdoor area",

  "err.userShort": "UJI username must be at least 4 characters.",
  "err.passShort": "UJI password must be at least 8 characters.",
  "err.badCredentials":
    "Wrong UJI credentials, or a second factor (Cl@ve) is required.",
  "err.ssoIncomplete": "SSO did not finish signing in to e-UJIer.",
  "err.noJsession":
    "No e-UJIer JSESSIONID was received. SSO sign-in did not finish.",
  "err.ssoForm": "UJI SSO form was not found (AuthState).",
  "err.tooManyRedirects": "Too many redirects in the UJI SSO flow.",
  "err.redirectNoLocation": "Redirect without Location from {{url}}",
  "err.hostDenied": "Host not allowed on the proxy: {{host}}",
  "err.httpsOnly": "HTTPS only.",
  "err.sessionExpired": "e-UJIer session expired. Sign in again.",
  "err.needsSecondFactor":
    "UJI is asking for a second factor. Enter the Google Authenticator code and sign in again.",
  "err.badOtp": "The verification code was not accepted.",
  "err.sessionMissing":
    "e-UJIer session not found (expired or server restart). Sign in again.",
  "err.demoCredentials": "Enter your UJI username and password.",
  "err.demoWrong": "Wrong credentials (demo mode). Try demo / demo.",
  "err.needSlot": "Select at least one slot.",
  "err.badSlot": "Invalid slot.",
  "err.sameCourt": "All slots must be on the same court and day.",
  "err.courtMissing": "Court not found.",
  "err.maxHours": "Maximum {{hours}} hours in a row ({{blocks}} × 30 min blocks).",
  "err.consecutive": "Slots must be consecutive.",
  "err.occupied": "This slot is already taken.",
  "err.bookingMissing": "Booking not found.",
  "err.cannotCancel": "You cannot cancel this booking.",
  "err.firma":
    "e-UJIer signature rejected (expired or wrong). Reload availability and try again.",
  "err.noConfirmButton":
    "Could not find the “Make booking” button (signature). Select the slots again.",
  "err.noSlots": "No slot selected.",
  "err.missingLiveMeta":
    "Missing live metadata (sql/signature) for {{time}}. Reload availability.",
  "err.sameInstall": "All slots must be on the same facility.",
  "err.sameDay": "All slots must be on the same day.",
  "err.noPersona": "Could not read p_persona from the slot.",
  "err.selectSlot": "Could not select the slot.",
  "err.notConfirmed": "The booking was not confirmed.",
  "err.noCancelMeta": "This booking has no e-UJIer cancel data.",
  "err.needSlotsPayload":
    "Send the full slots (with live metadata) to book.",
  "err.courtNotOnPortal":
    "Could not find “{{court}}” on the e-UJIer availability grid.",
  "err.slotNotOnPortal":
    "Could not find {{court}} at {{time}} on e-UJIer.",
  "err.slotTakenLive":
    "{{court}} at {{time}} is already booked on e-UJIer. The grid was demo data; reload the day.",
  "err.needPersonaList":
    "Open Bookings first so availability can load (p_persona is required).",
  "err.needPersona": "Missing p_persona; load availability first.",
  "err.notInList": "Booking not found in the e-UJIer list.",
  "err.parseAvailability":
    "Could not read e-UJIer availability. Showing demo data. Check UJI_RESERVAS_DISPONIBLE_BODY if needed.",
  "err.proxyLiveOnly": "Proxy is only available in live mode",
  "err.notAuthenticated": "Not signed in",
  "err.proxyFailed": "Proxy failed",
  "err.liveUnavailable": "e-UJIer unavailable",
  "err.bookingFailed": "Booking failed",
  "err.cancelFailed": "Could not cancel",
  "err.sportDate": "Sport and date are required",
  "err.slotRequired": "A slot is required",
  "err.idRequired": "An id is required",
  "err.badProcedure":
    "procedure must look like uji_sports.reservas_usuario.reservas_tipos",
  "err.emptyBody": "Empty API response",
  "err.emptyHttp": "HTTP {{status}} error (empty response)",
  "err.notJson":
    "The API did not return JSON (HTTP {{status}}). Vite may not be proxying to :4322.",
  "err.loginHttp": "Sign-in failed (HTTP {{status}})",
  "err.cookieMissing":
    "The server accepted sign-in but the session cookie was not saved. Reload the page and try again.",
  "err.availability": "Availability error",
  "err.bookingsList": "Could not load bookings",
};

export function parseLocale(raw: string | null | undefined): Locale | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ca")) return "ca";
  return null;
}

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = locale === "en" ? en[key] : ca[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{{${name}}}`, String(value));
    }
  }
  return text;
}

const ZONE_BY_SPORT: Record<string, MessageKey> = {
  padel: "zone.rackets",
  padelVidre: "zone.rackets",
  tennis: "zone.rackets",
  squash: "zone.rackets",
  pickleball: "zone.rackets",
  fronto: "zone.rackets",
  badminton: "zone.pavilion",
  escalada: "zone.pavilion",
  ironfit: "zone.pavilion",
  football7: "zone.outdoor",
  volleyball: "zone.outdoor",
};

export function sportNameKey(id: string): MessageKey {
  const key = `sport.${id}` as MessageKey;
  return key in ca ? key : "sport.padel";
}

export function zoneKeyForSport(id: string): MessageKey {
  return ZONE_BY_SPORT[id] ?? "zone.rackets";
}

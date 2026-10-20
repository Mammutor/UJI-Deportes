export type Locale = "va" | "es" | "en";

export const LOCALES: Locale[] = ["va", "es", "en"];

const va = {
  "lang.label": "Idioma",
  "lang.va": "Valencià",
  "lang.es": "Castellà",
  "lang.en": "English",

  "app.title": "UJI Sistema de reserves esportives",
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
  "sport.tableTennis": "Tennis taula",
  "sport.other": "Altres",

  "zone.rackets": "Zona de raquetes",
  "zone.pavilion": "Pavelló",
  "zone.outdoor": "Zona d'aire lliure",
  "zone.table": "Tennis taula",

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

export type MessageKey = keyof typeof va;

const en: { [K in MessageKey]: string } = {
  "lang.label": "Language",
  "lang.va": "Valencian",
  "lang.es": "Spanish",
  "lang.en": "English",

  "app.title": "UJI Sports Bookingsystem",
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
  "sport.tableTennis": "Table tennis",
  "sport.other": "Other",

  "zone.rackets": "Racket zone",
  "zone.pavilion": "Pavilion",
  "zone.outdoor": "Outdoor area",
  "zone.table": "Table tennis",

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

const es: { [K in MessageKey]: string } = {
  "lang.label": "Idioma",
  "lang.va": "Valenciano",
  "lang.es": "Español",
  "lang.en": "Inglés",

  "app.title": "UJI Sistema de reservas deportivas",
  "app.subtitle": "Reserva pádel y otras pistas del Servicio de Deportes.",
  "app.officialInfo": "Info oficial:",
  "app.officialLink": "Reservas y uso",
  "app.sportsService": "Servicio de Deportes · UJI",
  "app.myBookings": "Mis reservas",
  "app.logout": "Salir",
  "app.loading": "Cargando…",

  "login.user": "Usuario UJI",
  "login.password": "Contraseña",
  "login.otp": "Código de verificación",
  "login.otpHint": "Google Authenticator, si UJI lo pide.",
  "login.submit": "Entrar",
  "login.connecting": "Conectando con UJI…",
  "login.sessionError": "Error de sesión",
  "login.mockTitle": "Modo demo (mock)",
  "login.mockBody":
    "Usa demo / demo. Cambia UJI_MODE=live para iniciar sesión con tus credenciales UJI (proxy en el servidor).",
  "login.liveTitle": "SSO UJI",
  "login.liveBody":
    "Las credenciales solo se usan en el servidor; no se guardan.",
  "login.slowNotice": "Puede tardar hasta 5 minutos.",
  "login.apiDown": "No se ha podido contactar con la API (/api/auth).",
  "login.apiHint":
    "Comprueba que pnpm dev tiene la API en :4322 y Vite en :4321, y recarga.",

  "nav.bookings": "Mis reservas",
  "bookings.subtitle": "Reservas activas en e-UJIer.",
  "bookings.new": "Nueva reserva",
  "bookings.loading": "Cargando reservas…",
  "bookings.emptyTitle": "Aún no tienes reservas",
  "bookings.emptyBody": "No hay reservas activas en el portal.",
  "bookings.cancel": "Cancelar",
  "bookings.cancelled": "Reserva cancelada",
  "bookings.error": "Error",

  "courts.title": "Reservas",
  "courts.meta": "{{zone}} · franjas de 30 min · máx. {{hours}} h seguidas",
  "courts.live": "en directo",
  "courts.free": "Libre",
  "courts.booked": "Reservado",
  "courts.unavailable": "Sin información",
  "courts.selected": "Seleccionado",
  "courts.hint": "Pulsa franjas verdes consecutivas (hasta {{blocks}})",
  "courts.loading": "Cargando disponibilidad…",
  "courts.loadingDays": "Cargando {{count}} días a la vez…",
  "courts.loadingProgress": "Día {{current}} de {{total}}.",
  "courts.slowNotice": "Puede tardar hasta 5 minutos.",
  "courts.loadDay": "Un día",
  "courts.loadWeek": "Semana completa",
  "courts.loadDayAll": "Un día, todos los deportes",
  "courts.loadWeekAll": "Semana completa, todos los deportes",
  "courts.metaAll": "Todos los deportes · franjas de 30 min",
  "courts.scopeSport": "Este deporte",
  "courts.scopeAll": "Todos los deportes",
  "courts.none": "No hay pistas para este deporte.",
  "courts.closed": "Cerrado este día.",
  "courts.indoor": "Interior",
  "courts.outdoor": "Exterior",
  "courts.alreadyBooked": "Ya reservado",
  "courts.clear": "Limpiar",
  "courts.book": "Reservar",
  "courts.confirmTitle": "Confirmar reserva",
  "courts.cancel": "Cancelar",
  "courts.confirmLive":
    "Se confirmará en e-UJIer: {{count}} franja(s) de 30 min (máx. {{hours}} h).",
  "courts.confirmMock":
    "Se seleccionarán {{count}} franjas de 30 min (máx. {{hours}} h).",
  "courts.maxToast": "Máximo {{hours}} h ({{blocks}} franjas de 30 min)",
  "courts.bookedToast": "Reservado {{court}} · {{date}} {{start}}–{{end}}",
  "courts.bookError": "Error en la reserva",
  "courts.sessionTitle": "Sesión e-UJIer no disponible",
  "courts.sessionFallback":
    "Hay que volver a iniciar sesión para obtener datos reales.",
  "courts.sessionDemo":
    "Mientras tanto se muestran las pistas locales (disponibilidad demo).",
  "courts.relogin": "Volver a entrar",

  "sport.padel": "Pádel",
  "sport.padelVidre": "Pádel cristal",
  "sport.tennis": "Tenis",
  "sport.squash": "Squash",
  "sport.pickleball": "Pickleball",
  "sport.badminton": "Bádminton",
  "sport.escalada": "Escalada/Boulder",
  "sport.fronto": "Frontón",
  "sport.ironfit": "Ironfit",
  "sport.football7": "Fútbol 7",
  "sport.volleyball": "Vóley playa",
  "sport.tableTennis": "Tenis de mesa",
  "sport.other": "Otros",

  "zone.rackets": "Zona de raquetas",
  "zone.pavilion": "Pabellón",
  "zone.outdoor": "Zona al aire libre",
  "zone.table": "Tenis de mesa",

  "err.userShort": "El usuario UJI debe tener al menos 4 caracteres.",
  "err.passShort": "La contraseña UJI debe tener al menos 8 caracteres.",
  "err.badCredentials":
    "Credenciales UJI incorrectas o hace falta un segundo factor (Cl@ve).",
  "err.ssoIncomplete": "La sesión SSO no ha completado el acceso a e-UJIer.",
  "err.noJsession":
    "No se ha obtenido el JSESSIONID de e-UJIer. El inicio de sesión SSO no se ha completado.",
  "err.ssoForm": "No se ha encontrado el formulario SSO UJI (AuthState).",
  "err.tooManyRedirects": "Demasiadas redirecciones en el flujo SSO UJI.",
  "err.redirectNoLocation": "Redirección sin Location desde {{url}}",
  "err.hostDenied": "Host no permitido en el proxy: {{host}}",
  "err.httpsOnly": "Solo HTTPS.",
  "err.sessionExpired": "Sesión e-UJIer caducada. Vuelve a iniciar sesión.",
  "err.needsSecondFactor":
    "UJI pide un segundo factor. Escribe el código de Google Authenticator y vuelve a entrar.",
  "err.badOtp": "El código de verificación no es válido.",
  "err.sessionMissing":
    "Sesión e-UJIer no encontrada (caducada o reinicio del servidor). Vuelve a iniciar sesión.",
  "err.demoCredentials": "Introduce el usuario y la contraseña UJI.",
  "err.demoWrong": "Credenciales incorrectas (modo demo). Prueba demo / demo.",
  "err.needSlot": "Hay que seleccionar al menos una franja.",
  "err.badSlot": "Franja no válida.",
  "err.sameCourt": "Todas las franjas deben ser de la misma pista y día.",
  "err.courtMissing": "Pista no encontrada.",
  "err.maxHours":
    "Máximo {{hours}} horas seguidas ({{blocks}} bloques de 30 min).",
  "err.consecutive": "Las franjas deben ser consecutivas.",
  "err.occupied": "Esta franja ya está ocupada.",
  "err.bookingMissing": "Reserva no encontrada.",
  "err.cannotCancel": "No puedes cancelar esta reserva.",
  "err.firma":
    "Firma e-UJIer rechazada (caducada o incorrecta). Vuelve a cargar la disponibilidad e inténtalo de nuevo.",
  "err.noConfirmButton":
    "No se ha encontrado el botón «Realizar reserva» (firma). Vuelve a seleccionar las franjas.",
  "err.noSlots": "Ninguna franja seleccionada.",
  "err.missingLiveMeta":
    "Falta metadata live (sql/firma) para {{time}}. Vuelve a cargar la disponibilidad.",
  "err.sameInstall": "Todas las franjas deben ser de la misma instalación.",
  "err.sameDay": "Todas las franjas deben ser del mismo día.",
  "err.noPersona": "No se ha podido obtener p_persona de la franja.",
  "err.selectSlot": "Error al seleccionar la franja.",
  "err.notConfirmed": "La reserva no se ha confirmado.",
  "err.noCancelMeta": "Esta reserva no tiene datos de cancelación e-UJIer.",
  "err.needSlotsPayload":
    "Hay que enviar las franjas completas (slots con metadata live) para reservar.",
  "err.courtNotOnPortal":
    "No se ha encontrado «{{court}}» en la disponibilidad de e-UJIer.",
  "err.slotNotOnPortal": "No se ha encontrado {{court}} a las {{time}} en e-UJIer.",
  "err.slotTakenLive":
    "{{court}} a las {{time}} ya está ocupada en e-UJIer. La cuadrícula era de demostración; vuelve a cargar el día.",
  "err.needPersonaList":
    "Abre primero «Reservas» para cargar la disponibilidad (hace falta p_persona).",
  "err.needPersona": "Falta p_persona; carga la disponibilidad antes.",
  "err.notInList": "Reserva no encontrada en el listado e-UJIer.",
  "err.parseAvailability":
    "No se ha podido interpretar la disponibilidad de e-UJIer. Se muestran datos demo. Revisa UJI_RESERVAS_DISPONIBLE_BODY si hace falta.",
  "err.proxyLiveOnly": "Proxy solo en modo live",
  "err.notAuthenticated": "No autenticado",
  "err.proxyFailed": "El proxy ha fallado",
  "err.liveUnavailable": "e-UJIer no disponible",
  "err.bookingFailed": "La reserva ha fallado",
  "err.cancelFailed": "No se ha podido cancelar",
  "err.sportDate": "Hacen falta deporte y fecha",
  "err.slotRequired": "Hace falta una franja",
  "err.idRequired": "Hace falta un identificador",
  "err.badProcedure":
    "procedure debe ser del tipo uji_sports.reservas_usuario.reservas_tipos",
  "err.emptyBody": "Respuesta vacía de la API",
  "err.emptyHttp": "Error HTTP {{status}} (respuesta vacía)",
  "err.notJson":
    "La API no ha devuelto JSON (HTTP {{status}}). Es posible que el proxy de Vite no llegue a :4322.",
  "err.loginHttp": "El inicio de sesión ha fallado (HTTP {{status}})",
  "err.cookieMissing":
    "El servidor ha aceptado el inicio de sesión pero la cookie de sesión no se ha guardado. Recarga la página y vuelve a intentarlo.",
  "err.availability": "Error de disponibilidad",
  "err.bookingsList": "Error al cargar las reservas",
};

const messages: Record<Locale, { [K in MessageKey]: string }> = { va, es, en };

export function parseLocale(raw: string | null | undefined): Locale | null {
  const v = (raw ?? "").trim().toLowerCase().replaceAll("_", "-");
  if (!v) return null;
  if (v === "va" || v.startsWith("va-") || v.includes("valenc")) return "va";
  if (v === "es" || v.startsWith("es-")) return "es";
  if (v === "en" || v.startsWith("en-")) return "en";
  // The previous Catalan option is Valencian.
  if (v === "ca" || v.startsWith("ca-")) return "va";
  return null;
}

export function htmlLang(locale: Locale): string {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  return "ca-ES-valencia";
}

export function dateLocale(locale: Locale): string {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es-ES";
  return "ca-ES-valencia";
}

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text: string = messages[locale][key];
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
  badminton: "zone.rackets",
  escalada: "zone.rackets",
  ironfit: "zone.rackets",
  football7: "zone.outdoor",
  volleyball: "zone.outdoor",
  tableTennis: "zone.table",
  other: "zone.rackets",
};

export function sportNameKey(id: string): MessageKey {
  const key = `sport.${id}` as MessageKey;
  return key in va ? key : "sport.padel";
}

export function zoneKeyForSport(id: string): MessageKey {
  return ZONE_BY_SPORT[id] ?? "zone.rackets";
}

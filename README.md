# UJI Deporte

Vite + React app to book courts at **Universitat Jaume I Servei d'Esports** (pàdel and other sports). Login with UJI credentials; the server proxies e-UJIer after SAML SSO. Hostable with Docker Compose, installable as a PWA on a shared phone, Capacitor-ready for Android.

**Real booking portal:** https://e-ujier.uji.es/pls/www/!uji_sports.usuari

## Quick start (local)

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open [http://127.0.0.1:4321](http://127.0.0.1:4321) (Vite). API runs on `4322` and is proxied at `/api`.

The API loads root `.env` on startup (`SESSION_SECRET`, …). Restart `pnpm dev` after changing it.

In dev, `API_PORT` (default 4322) is used — not `PORT`. If you see Vite on 4322 and proxy `ENOBUFS`/`ECONNREFUSED`, an old API process probably grabbed 4321; stop all `pnpm dev` / node watchers and start again.

## UJI session

```bash
# .env
SESSION_SECRET=a-long-random-string
```

1. Open the app login page and enter **your** UJI username/password.
2. The **hosted API** completes SimpleSAMLphp SSO server-side, keeps e-UJIer cookies in memory (never sent to the browser), and issues our own `uji_deporte_session` cookie.
3. Call sports endpoints through the proxy, e.g.:

```bash
curl -X POST http://127.0.0.1:4322/api/uji/proxy \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"procedure":"uji_sports.reservas_usuario.reservas_tipos","body":"pcursoaca=2026&divid=PanelRealizarTiposU&_=&p_mesanyo=202610"}'
```

Court grids load from `reservas_disponible` (30‑min blocks: green = free, red = booked). Default body: `p_fecha=DD/MM/YYYY&divid=PanelDisponibilidadU&_=`. Override with `UJI_RESERVAS_DISPONIBLE_BODY` (`{date}` → DD/MM/YYYY) if the portal expects a different form.

Multi-select up to **1.5 h** (3 consecutive half-hours) on one court. Live booking:

1. `!ujitreeapl2.update_sql` → `pon_parametro_reserva_usuario` (each selected slot + firma)
2. `pinta_boton_realizar_reserva` → fresh firma
3. `update_sql` → `pon_carrito` (confirm)
4. `listado_reservas` / cancel via `eliminar_reserva`

### How long is the UJI session valid?

| Cookie | Observed lifetime |
|---|---|
| `SimpleSAMLSessionID` (IdP) | **8 hours** (`Max-Age=28800`) |
| `JSESSIONID` (e-UJIer) | **Session cookie** (no `Max-Age`) — ends when the Oracle app idle-timeouts or SSO dies |
| `uji_deporte_session` (this app) | **12 hours** signed JWT |

Passwords are used only for the SSO POST and are **not** stored. Live cookies live in server memory (lost on process restart).

## Docker Compose

```bash
cp .env.example .env
# set a strong SESSION_SECRET
docker compose up --build
```

App: [http://127.0.0.1:4321](http://127.0.0.1:4321) (override with `APP_PORT`).

Sign-in always uses UJI SSO. The server keeps the e-UJIer cookies and calls `uji_sports.*`.

## Phone install (PWA)

1. Run or deploy the app on a host the phone can reach (**HTTPS** for install prompts on most browsers).
2. Open in Chrome (Android) or Safari (iOS).
3. **Android:** menu → *Install app* / *Add to Home screen*.
4. **iOS Safari:** Share → *Add to Home Screen*.
5. Use the home-screen icon for shared/central phone use.

## Android / Capacitor

```bash
pnpm build
pnpm exec cap add android   # once
pnpm cap:sync
pnpm cap:android
```

`capacitor.config.ts` uses `webDir: "dist"`. For live API calls, point Capacitor at your hosted Docker URL or keep using the PWA. Never embed UJI passwords in the APK.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Vite **4321** + API **4322** |
| `pnpm build` | Typecheck + Vite production build |
| `pnpm start` | Serve API + static `dist` (port **4321**) |
| `pnpm lint` | Oxlint |

## Stack

Vite · React · TypeScript · Tailwind · shadcn-style UI · Hono API · Capacitor · PWA · Docker Compose

## Security

- Do not commit `.env` or real UJI credentials.
- Rotate `SESSION_SECRET` on shared hosts.
- Personal booking helper for your own UJI account — not a campus multi-user auth server.
- Live mode holds university session cookies only on the server you host.

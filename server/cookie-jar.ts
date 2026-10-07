export type StoredCookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expiresAt?: number;
};

/** Minimal cookie jar for cross-host UJI SSO + e-UJIer calls. */
export class CookieJar {
  private cookies = new Map<string, StoredCookie>();

  static fromHeader(cookieHeader: string): CookieJar {
    const jar = new CookieJar();
    for (const part of cookieHeader.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const i = trimmed.indexOf("=");
      if (i <= 0) continue;
      jar.set(trimmed.slice(0, i), trimmed.slice(i + 1));
    }
    return jar;
  }

  set(name: string, value: string, meta: Partial<StoredCookie> = {}) {
    this.cookies.set(name, { name, value, ...meta });
  }

  get(name: string): string | undefined {
    return this.cookies.get(name)?.value;
  }

  absorb(res: Response, fallbackUrl?: string) {
    const host = fallbackUrl ? new URL(fallbackUrl).hostname : undefined;
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? [...res.headers.getSetCookie()]
        : [];

    if (setCookies.length === 0) {
      const single = res.headers.get("set-cookie");
      if (single) setCookies.push(single);
    }

    for (const raw of setCookies) {
      const parts = raw.split(";").map((p) => p.trim());
      const [nv, ...attrs] = parts;
      const eq = nv.indexOf("=");
      if (eq <= 0) continue;
      const name = nv.slice(0, eq);
      const value = nv.slice(eq + 1);
      const meta: Partial<StoredCookie> = { domain: host, path: "/" };
      for (const attr of attrs) {
        const lower = attr.toLowerCase();
        if (lower.startsWith("domain=")) meta.domain = attr.slice(7);
        else if (lower.startsWith("path=")) meta.path = attr.slice(5);
        else if (lower.startsWith("max-age=")) {
          const seconds = Number(attr.slice(8));
          if (Number.isFinite(seconds)) {
            meta.expiresAt = Date.now() + seconds * 1000;
          }
        } else if (lower.startsWith("expires=")) {
          const t = Date.parse(attr.slice(8));
          if (!Number.isNaN(t)) meta.expiresAt = t;
        }
      }
      if (value === "" || lowerHas(attrs, "max-age=0")) {
        this.cookies.delete(name);
        continue;
      }
      this.set(name, value, meta);
    }
  }

  headerFor(url: string): string {
    const u = new URL(url);
    const now = Date.now();
    const out: string[] = [];
    for (const c of this.cookies.values()) {
      if (c.expiresAt && c.expiresAt <= now) continue;
      if (c.domain && !domainMatches(u.hostname, c.domain)) continue;
      out.push(`${c.name}=${c.value}`);
    }
    return out.join("; ");
  }

  /** Serialize for server-side session storage. */
  serialize(): StoredCookie[] {
    return [...this.cookies.values()];
  }

  static deserialize(list: StoredCookie[]): CookieJar {
    const jar = new CookieJar();
    for (const c of list) jar.cookies.set(c.name, c);
    return jar;
  }

  /** Longest known expiry among session cookies (ms). */
  maxExpiresAt(fallbackMs: number): number {
    let max = 0;
    for (const c of this.cookies.values()) {
      if (c.expiresAt && c.expiresAt > max) max = c.expiresAt;
    }
    return max || Date.now() + fallbackMs;
  }
}

function lowerHas(attrs: string[], prefix: string) {
  return attrs.some((a) => a.toLowerCase().startsWith(prefix));
}

function domainMatches(host: string, domain: string) {
  const d = domain.startsWith(".") ? domain.slice(1) : domain;
  return host === d || host.endsWith(`.${d}`);
}

const BOOKING = "https://e-ujier.uji.es/pls/www/!uji_sports.usuari";

class Jar {
  cookies = new Map();
  absorb(res, url) {
    const host = new URL(url).hostname;
    const list =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];
    if (!list.length) {
      const single = res.headers.get("set-cookie");
      if (single) list.push(single);
    }
    for (const raw of list) {
      const [nv] = raw.split(";");
      const i = nv.indexOf("=");
      if (i > 0) this.cookies.set(`${host}|${nv.slice(0, i)}`, nv.slice(i + 1));
    }
  }
  header() {
    return [...this.cookies.entries()]
      .map(([, v], idx, arr) => {
        const key = [...this.cookies.keys()][idx];
        const name = key.split("|").slice(1).join("|");
        return `${name}=${v}`;
      })
      .join("; ");
  }
}

function abs(base, href) {
  return new URL(href, base).toString();
}
function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

const jar = new Jar();
let url = BOOKING;
let html = "";
for (let i = 0; i < 12; i++) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: {
      Cookie: jar.header(),
      "User-Agent": "UJI-Deporte/0.1",
    },
  });
  jar.absorb(res, url);
  const loc = res.headers.get("location");
  console.log(i, res.status, url.slice(0, 100));
  if (
    loc &&
    (res.status === 301 ||
      res.status === 302 ||
      res.status === 303 ||
      res.status === 307 ||
      res.status === 308)
  ) {
    url = abs(url, loc);
    continue;
  }
  html = await res.text();
  break;
}

const action =
  pick(html, /<form[^>]*id=["']login-form["'][^>]*action=["']([^"']+)["']/i) ||
  pick(html, /<form[^>]*action=["']([^"']+)["'][^>]*id=["']login-form["']/i);
const authState =
  pick(html, /name=["']AuthState["']\s+value=["']([^"']+)["']/i) ||
  pick(html, /value=["']([^"']+)["']\s+name=["']AuthState["']/i);
console.log("action", action);
console.log("authState", authState?.slice(0, 100));
if (!action || !authState) {
  console.log(html.slice(0, 800));
  process.exit(1);
}

const body = new URLSearchParams({
  AuthState: authState.replace(/&amp;/g, "&"),
  userName: "notarealuser",
  password: "notarealpassword1",
  login: "1",
});
const postUrl = abs(url, action.replace(/&amp;/g, "&"));
const res2 = await fetch(postUrl, {
  method: "POST",
  redirect: "manual",
  headers: {
    Cookie: jar.header(),
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "UJI-Deporte/0.1",
    Origin: "https://xmlrpc.uji.es",
    Referer: url,
  },
  body,
});
jar.absorb(res2, postUrl);
console.log("login POST", res2.status, res2.headers.get("location")?.slice(0, 140));
let next = res2.headers.get("location");
let page = await res2.text();
if (next) {
  url = abs(postUrl, next);
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { Cookie: jar.header(), "User-Agent": "UJI-Deporte/0.1" },
    });
    jar.absorb(res, url);
    const loc = res.headers.get("location");
    console.log("follow", i, res.status, url.slice(0, 100));
    if (loc && res.status >= 300 && res.status < 400) {
      url = abs(url, loc);
      continue;
    }
    page = await res.text();
    break;
  }
}
console.log(
  "error markers",
  /incorrect|inv[aà]lid|fallid|credencial|Error|error/i.test(page),
);
console.log("title", page.match(/<title>[^<]+/i)?.[0]);
console.log(page.slice(0, 600));

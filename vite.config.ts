import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Project Pages URL is https://<user>.github.io/<repo>/. Leave unset for `/`. */
function pagesBase(): string {
  const raw = process.env.PAGES_BASE?.trim();
  if (!raw || raw === "/") return "/";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

function githubPagesSpaFallback(base: string): Plugin {
  return {
    name: "github-pages-spa-fallback",
    apply: "build",
    closeBundle() {
      if (base === "/") return;
      const dist = path.resolve(rootDir, "dist");
      copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
      writeFileSync(path.join(dist, ".nojekyll"), "");
    },
  };
}

export default defineConfig(() => {
  const base = pagesBase();

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      githubPagesSpaFallback(base),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icons/*.png"],
        manifest: {
          name: "UJI Deporte",
          short_name: "UJI Deporte",
          description:
            "Reserva pistes de pàdel i altres esports del Servei d'Esports UJI.",
          theme_color: "#0b3d2e",
          background_color: "#eef6f1",
          display: "standalone",
          orientation: "portrait-primary",
          lang: "ca",
          start_url: base,
          icons: [
            {
              src: `${base}icons/icon-192.png`,
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: `${base}icons/icon-512.png`,
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: `${base}icons/icon-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          // Do not intercept /api. A GET-only route here claims the session
          // check that runs immediately after sign-in, and that fetch can
          // leave the browser before the new cookie is visible.
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    server: {
      host: "127.0.0.1",
      port: 4321,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:4322",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4321,
    },
  };
});

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "es.uji.deporte.app",
  appName: "UJI Deporte",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;

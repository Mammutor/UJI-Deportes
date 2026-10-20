import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "es.uji.deporte.app",
  appName: "UJI Sports Bookingsystem",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;

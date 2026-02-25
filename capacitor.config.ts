import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.warepick.app',
  appName: 'WarePick',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;

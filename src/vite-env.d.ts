/// <reference types="vite/client" />

interface Window {
  crickTrack?: {
    platform: NodeJS.Platform;
    getVersion?: () => Promise<string>;
    openExternal?: (url: string) => Promise<boolean>;
  };
  sportsLedger?: {
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<boolean>;
  };
}

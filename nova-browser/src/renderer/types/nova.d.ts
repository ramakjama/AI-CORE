export {};

declare global {
  interface Window {
    nova: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      navigate: (url: string) => Promise<{ success: boolean; url: string }>;
      goBack: () => Promise<{ success: boolean }>;
      goForward: () => Promise<{ success: boolean }>;
      reload: () => Promise<{ success: boolean }>;
      platform: string;
    };
  }
}

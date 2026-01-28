/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        allowpopups?: string;
        webpreferences?: string;
        partition?: string;
        preload?: string;
      },
      HTMLElement
    >;
  }
}

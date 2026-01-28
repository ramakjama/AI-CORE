declare module 'reveal.js' {
  export interface RevealOptions {
    embedded?: boolean;
    controls?: boolean;
    progress?: boolean;
    center?: boolean;
    hash?: boolean;
    transition?: string;
    width?: number;
    height?: number;
    margin?: number;
    [key: string]: any;
  }

  export default class Reveal {
    constructor(element: HTMLElement, options?: RevealOptions);
    initialize(): Promise<void>;
    slide(h: number, v?: number, f?: number): void;
    destroy(): void;
    next(): void;
    prev(): void;
    layout(): void;
    sync(): void;
    syncSlide(slide?: Element): void;
    syncFragments(slide?: Element): void;
    on(type: string, listener: Function): void;
    off(type: string, listener: Function): void;
    addEventListener(type: string, listener: Function): void;
    removeEventListener(type: string, listener: Function): void;
    [key: string]: any;
  }
}

declare module 'reveal.js/dist/reveal.css';
declare module 'reveal.js/dist/theme/black.css';
declare module 'reveal.js/dist/theme/white.css';
declare module 'reveal.js/dist/theme/league.css';
declare module 'reveal.js/dist/theme/beige.css';
declare module 'reveal.js/dist/theme/sky.css';
declare module 'reveal.js/dist/theme/night.css';
declare module 'reveal.js/dist/theme/serif.css';
declare module 'reveal.js/dist/theme/simple.css';
declare module 'reveal.js/dist/theme/solarized.css';
declare module 'reveal.js/dist/theme/moon.css';

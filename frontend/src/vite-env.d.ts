/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __BUILD_TIME__: string;
declare const __GIT_SHA__: string;
declare const __APP_VERSION__: string;

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}


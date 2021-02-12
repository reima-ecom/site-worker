/*

Move this file to its own repo!

*/

declare global {
  type FetchEventListener = (event: FetchEvent) => void;

  interface FetchEvent extends Event {
    readonly request: Request;
    waitUntil(f: any): void;
    respondWith(r: Response | Promise<Response>): void;
  }

  function addEventListener(
    type: "fetch",
    callback: FetchEventListener,
  ): void;
}

export {};

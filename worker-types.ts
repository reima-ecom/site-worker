/*

Move this file to its own repo!

*/

declare global {
  type FetchEventHandler = (event: FetchEvent) => void;

  interface FetchEvent extends Event {
    readonly request: Request;
    waitUntil(f: any): void;
    respondWith(r: Response | Promise<Response>): void;
  }

  function addEventListener(
    type: "fetch",
    callback: FetchEventHandler,
  ): void;
}

export {};

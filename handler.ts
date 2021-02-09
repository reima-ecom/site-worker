import { RedirectHandler } from "./redirecter.ts";
import "./worker-types.ts";

export type FetchEventListener = (event: FetchEvent) => void;

export type FetchEventResponder = (
  event: FetchEvent,
) => Promise<Response | undefined>;

type FetchEventHandler = (
  event: FetchEvent,
) => Promise<Response>;

type EventHandlerOptions = {
  getAsset: FetchEventResponder;
  getRedirect: RedirectHandler;
  stripTrailingSlash?: boolean;
};

export const _getEventHandler: (
  opts: EventHandlerOptions,
) => FetchEventHandler = (
  { getAsset, getRedirect, stripTrailingSlash },
) =>
  async (event) =>
    // - return asset response (with correct trailing slash) OR
    await getAsset(event) ||
    // - find and return redirect response OR
    await getRedirect(event) ||
    // - redirect based on trailing slash OR
    // - return styled 404
    // - return hard 404
    new Response("Not found", { status: 404 });

export const getEventListener: (
  opts: EventHandlerOptions,
) => FetchEventListener = (opts) => {
  const handleEvent = _getEventHandler(opts);
  return (event) => {
    event.respondWith(handleEvent(event));
  };
};

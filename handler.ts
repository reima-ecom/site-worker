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

const _hasTrailingSlashAndNotRoot = (url: string) => {
  // get pathname and remove the slash in the beginning
  // so that the root `/` doesn't match
  return new URL(url).pathname.substring(1).endsWith("/");
};

const _passthroughIfTrailingSlash = async (
  getAsset: FetchEventResponder,
  event: FetchEvent,
): Promise<Response | undefined> => {
  if (_hasTrailingSlashAndNotRoot(event.request.url)) {
    return undefined;
  }
  return getAsset(event);
};

const _redirectIfTrailingSlash = async (
  event: FetchEvent,
): Promise<Response | undefined> => {
  if (_hasTrailingSlashAndNotRoot(event.request.url)) {
    const url = new URL(event.request.url);
    return new Response(
      "This site does not use trailing slashes for directories",
      {
        status: 301,
        headers: {
          "Location": url.pathname.slice(0, -1) + url.search,
        },
      },
    );
  }
};

export const _getEventHandler: (
  opts: EventHandlerOptions,
) => FetchEventHandler = (
  { getAsset, getRedirect, stripTrailingSlash },
) =>
  async (event) =>
    // - return asset response (with correct trailing slash) OR
    await (stripTrailingSlash
      ? _passthroughIfTrailingSlash(getAsset, event)
      : getAsset(event)) ||
    // - find and return redirect response OR
    await getRedirect(event) ||
    // - redirect based on trailing slash OR
    await (stripTrailingSlash ? _redirectIfTrailingSlash(event) : undefined) ||
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

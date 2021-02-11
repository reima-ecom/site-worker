import { rewriteForTesting } from "./ab-test-rewriter.ts";
import { RedirectHandler } from "./redirecter.ts";
import "./worker-types.ts";

export type FetchEventListener = (event: FetchEvent) => void;

export type RequestHandler = (
  request: Request,
) => Promise<Response | undefined>;

type FetchEventHandler = (
  event: FetchEvent,
) => Promise<Response>;

type EventHandlerOptions = {
  getAsset: RequestHandler;
  getRedirect?: RedirectHandler;
  enableExperiments?: string[];
  stripTrailingSlash?: boolean;
};

const _hasTrailingSlashAndNotRoot = (url: string) => {
  // get pathname and remove the slash in the beginning
  // so that the root `/` doesn't match
  return new URL(url).pathname.substring(1).endsWith("/");
};

const _passthroughIfTrailingSlash = async (
  getAsset: RequestHandler,
  request: Request,
): Promise<Response | undefined> => {
  if (_hasTrailingSlashAndNotRoot(request.url)) {
    return undefined;
  }
  return getAsset(request);
};

const _redirectIfTrailingSlash = async (
  request: Request,
): Promise<Response | undefined> => {
  if (_hasTrailingSlashAndNotRoot(request.url)) {
    const url = new URL(request.url);
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

const _changeRequestUrlPath = (urlPath: string) =>
  (request: Request): Request => {
    const url = new URL(request.url);
    url.pathname = urlPath;
    return new Request(url.toString());
  };

export const _getEventHandler: (
  opts: EventHandlerOptions,
) => FetchEventHandler = (
  { getAsset, getRedirect, stripTrailingSlash },
) =>
  async ({ request }) =>
    // - return asset response (with correct trailing slash) OR
    await (stripTrailingSlash
      ? _passthroughIfTrailingSlash(getAsset, request)
      : getAsset(request)) ||
    // - find and return redirect response OR
    (getRedirect ? await getRedirect(request) : undefined) ||
    // - redirect based on trailing slash OR
    (stripTrailingSlash ? await _redirectIfTrailingSlash(request)
    : undefined) ||
    // - return styled 404
    await Promise.resolve(request)
      .then(_changeRequestUrlPath("/404.html"))
      .then(getAsset) ||
    // - return hard 404
    new Response("Not found", { status: 404 });

export const getEventListener: (
  opts: EventHandlerOptions,
) => FetchEventListener = (optionsInput) =>
  (event) => {
    const options = { ...optionsInput };
    // wrap opts.getAsset here in case we have ab tests
    if (optionsInput.enableExperiments) {
      options.getAsset = rewriteForTesting(
        optionsInput.enableExperiments,
        optionsInput.getAsset,
        event,
      );
    }
    const handleEvent = _getEventHandler(options);
    event.respondWith(handleEvent(event));
  };

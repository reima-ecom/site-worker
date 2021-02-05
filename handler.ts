import "./worker-types.ts";
import type { FetchEventResponder, RedirectResponder } from "./domain-types.ts";

type EventHandlerDependencies = {
  getAsset: FetchEventResponder;
  getRedirect: RedirectResponder;
};

type EventHandlerOptions = {
  stripTrailingSlash?: boolean;
};

type EventHandlerGetter = (
  deps: EventHandlerDependencies,
  opts?: EventHandlerOptions,
) => FetchEventResponder;

export const getEventHandler: EventHandlerGetter = (
  { getAsset, getRedirect },
  { stripTrailingSlash } = {},
) =>
  async (event) => {
    // url and pathname is needed in various places
    const url = new URL(event.request.url);

    // check if trailing slash stripping turned on, and the
    // current url ends in trailing slash (not including root)
    if (
      stripTrailingSlash && url.pathname !== "/" && url.pathname.endsWith("/")
    ) {
      // check for a redirect for this path
      const redirectResponse = await getRedirect(url.pathname);
      if (redirectResponse) return redirectResponse;
      // default to path without slash
      return new Response(
        "Moved",
        {
          status: 301,
          headers: {
            // delete the last char of the pathname (the `/`)
            // include search in the redirect url
            Location: url.pathname.slice(0, -1) + url.search,
          },
        },
      );
    }

    // fetch the requested asset
    const assetResponse = await getAsset(event);

    // if this was a 404, check for redirect
    if (assetResponse.status === 404) {
      const redirectResponse = await getRedirect(url.pathname);
      if (redirectResponse) return redirectResponse;
    }

    return assetResponse;
  };

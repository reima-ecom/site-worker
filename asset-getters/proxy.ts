import "../worker-types.ts";
import { FetchEventHandler } from "../handler.ts";

/**
 * Proxy request to another host, but only considering url
 */
export const fetchFromHost = (hostname: string): FetchEventHandler =>
  async ({ request }) => {
    // get url
    const url = new URL(request.url);
    // change host to new hostname
    url.hostname = hostname;
    // add trailing slash if directory
    // (this in order to avoid a redirect e.g. `/folder` -> `/folder/`)
    const lastPathSegment = url.pathname.split("/").pop();
    if (lastPathSegment && !lastPathSegment.includes(".")) url.pathname += "/";
    // fetch without headers or anything else from the original request
    return fetch(url.toString());
  };

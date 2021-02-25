import "../worker-types.ts";
import type { FetchEventHandler } from "../handler.ts";

/**
 * Fetch request from the configured origin
 */
export const fetchFromOrigin: FetchEventHandler = async ({ request }) => {
  return fetch(request);
};

export const fetchFromOriginWithTrailingSlash: FetchEventHandler = async ({ request }) => {
  // get url
  const url = new URL(request.url);
  // add trailing slash if directory
  // (this in order to avoid a redirect e.g. `/folder` -> `/folder/`)
  const lastPathSegment = url.pathname.split("/").pop();
  if (lastPathSegment && !lastPathSegment.includes(".")) url.pathname += "/";
  // fetch without headers or anything else from the original request
  return fetch(url.toString(), request);
};

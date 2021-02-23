import "../worker-types.ts";
import type { FetchEventHandler } from "../handler.ts";

/**
 * Fetch request from the configured origin
 */
export const fetchFromOrigin: FetchEventHandler = async ({ request }) => {
  return fetch(request);
};

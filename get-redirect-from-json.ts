import type { RedirectFinder } from "./domain-types.ts";

export type Redirect = {
  from: string;
  to: string;
  code?: 301 | 302;
};

/**
 * Get a redirect getter (url to redirect) function when the source is an array of redirects.
 * @param redirectsArray Array of redirects to search for
 */
export const getRedirectGetter = (redirectsArray: Redirect[]): RedirectFinder =>
  async (path) => {
    const redirect = redirectsArray.find((r) => r.from === path);
    if (!redirect) return undefined;
    return {
      toPath: redirect.to,
      statusCode: redirect.code,
    };
  };

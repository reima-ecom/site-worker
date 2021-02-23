import type { FetchEventHandler } from "../handler.ts";

/**
 * Set the specified query string parameter as a cookie with
 * the given name, if such a parameter is found.
 * 
 * Gets the asset with the given asset getter.
 */
export const queryStringToCookie = (
  queryStringParameter: string,
  cookieName: string,
  getAsset: FetchEventHandler,
): FetchEventHandler =>
  async (event) => {
    let response = await getAsset(event);
    const url = new URL(event.request.url);
    if (url.searchParams.has(queryStringParameter)) {
      // create a new response to get mutable headers
      response = new Response(response.body, response);
      // max-age 30 days
      response.headers.append(
        "Set-Cookie",
        `${cookieName}=${
          url.searchParams.get(queryStringParameter)
        }; Path=/; Max-Age=2592000; SameSite=Lax;`,
      );
    }
    return response;
  };

import type { ResponseTransformer } from "../handler.ts";
import { setCookie } from "../deps.ts";

export type CountryRedirect = {
  /** Uppercase two-letter ISO country code */
  countryCode: string;
  /** Subdirectory for country site without slashes */
  subdirectory: string;
};

export const getCountryRedirecter = (
  countryRedirects: CountryRedirect[],
): ResponseTransformer =>
  async ({ request }) => {
    const countryRedirect = countryRedirects.find((c) =>
      c.countryCode === request.cf?.country
    );
    // check redirection conditions
    // one at a time to minimize compute
    if (countryRedirect) {
      const url = new URL(request.url);
      const [, subdir] = url.pathname.split("/");
      if (subdir !== countryRedirect.subdirectory) {
        const cookie = request.headers.get("Cookie") || "";
        if (!cookie.includes("Redirected=true")) {
          // dummy await for type checking
          await Promise.resolve();
          const response = new Response("Redirecting", {
            status: 302,
            headers: { Location: `/${countryRedirect.subdirectory}/` },
          });
          setCookie(response, {
            name: "Redirected",
            value: "true",
            path: "/",
            sameSite: "Lax",
            maxAge: 2_629_746,
          });
          return response;
        }
      }
    }
    return undefined;
  };

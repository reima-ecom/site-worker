import "./worker-types.ts";
import "./worker-cloudflare-types.ts";
import { setCookie } from "./deps.ts";

export type ConsentRewriter = (
  event: FetchEvent,
  response: Response,
) => Response;

export class DisableAnalyticsHandler {
  element(element: Element) {
    if (element.hasAttribute("src")) {
      element.setAttribute("load-on-consent", element.getAttribute("src")!);
    } else if (element.tagName === "SCRIPT") {
      element.setAttribute("type", "text/plain");
    }
  }
}

export class ShowBannerHandler {
  element(element: Element) {
    element.setAttribute("show", "");
  }
}

const europeanUnionCountries = [
  "BE", // Belgium
  "EL", // Greece
  "LT", // Lithuania
  "PT", // Portugal
  "BG", // Bulgaria
  "ES", // Spain
  "LU", // Luxembourg
  "RO", // Romania
  "CZ", // Czechia
  "FR", // France
  "HU", // Hungary
  "SI", // Slovenia
  "DK", // Denmark
  "HR", // Croatia
  "MT", // Malta
  "SK", // Slovakia
  "DE", // Germany
  "IT", // Italy
  "NL", // Netherlands
  "FI", // Finland
  "EE", // Estonia
  "CY", // Cyprus
  "AT", // Austria
  "SE", // Sweden
  "IE", // Ireland
  "LV", // Latvia
  "PL", // Poland
];

const californiaPops = [
  // https://www.cloudflarestatus.com/
  "LAX",
  "SMF",
  "SAN",
  "SJC",
];

export const _rewriteForConsent: (
  HtmlRewriterClass: typeof HTMLRewriter,
) => ConsentRewriter = (htmlRewriter) =>
  (event, response) => {
    if (
      // check for european union
      europeanUnionCountries.includes(event.request.cf.country)
    ) {
      // if query string, get value and set response headers
      let gdprConsent = new URL(event.request.url).searchParams.get(
        "gdpr-consent",
      );
      if (gdprConsent) {
        setCookie(response, {
          name: "GDPR-Consent",
          value: gdprConsent,
          path: "/",
          maxAge: 2_629_746, // one month
        });
      }

      // if not given through query string, check cookie and get value
      if (!gdprConsent) {
        const cookie = event.request.headers.get("Cookie");
        [, gdprConsent] = cookie?.match(/GDPR-Consent=(\w+)/) || [];
      }

      if (!gdprConsent || gdprConsent === "no") {
        // disable analytics if no response or response is "no"
        let rewriter = new htmlRewriter().on(
          "[uses-cookies]",
          new DisableAnalyticsHandler(),
        );
        // show gdpr banner if no response given
        if (!gdprConsent) {
          rewriter = rewriter.on("[gdpr]", new ShowBannerHandler());
        }
        return rewriter.transform(response);
      }
    } else if (
      // check california CCPA
      event.request.cf.regionCode === "CA" ||
      californiaPops.includes(event.request.cf.colo)
    ) {
      // if no ccpa-notice cookie, set that and show banner
      const noticeGiven = event.request.headers.get("Cookie")?.includes(
        "CCPA-Notice",
      );
      if (!noticeGiven) {
        setCookie(response, {
          name: "CCPA-Notice",
          value: "given",
          path: "/",
          maxAge: 2_629_746, // one month
        });
        return new htmlRewriter()
          .on("[ccpa]", new ShowBannerHandler())
          .transform(response);
      }
    }
    return response;
  };

export const rewriteForConsent: ConsentRewriter = (event, response) => {
  return _rewriteForConsent(HTMLRewriter)(event, response);
};

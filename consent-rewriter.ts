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

/**
 * Will rewrite the response to show consent/privacy banners and
 * possibly disable analytics. Currently supported consent mechanisms
 * are GDPR and CCPA.
 * 
 * The banners to show should be hidden by default and shown via CSS when
 * the `show` attribute is present on the banner element.
 * 
 * **GDPR** handling if the request comes from an EU country
 * 
 * The consent answer is stored in a cookie named `GDPR-Consent`. This cookie
 * should take on the value of either "yes" or "no".
 * 
 * - If no consent answer given yet, add a `show` attribute to elements that 
 * have a `gdpr` attribute (i.e. show GDPR banner).
 * - If no answer is given or consent is rejected, disable analytics scripts
 * (see below).
 * - If the url has the `gdpr-consent` query string parameter, set the consent
 * cookie to that value. (E.g. `/pages/a-page?gdpr-consent=no`.) So in order
 * to hide the banner and persist the answer in the cookie, just link to 
 * `?gdpr-consent=yes` for the "accept" button (or do it client-side).
 * 
 * **CCPA** handling if the request comes from California
 * 
 * If this is the first visit, add a `show` attribute to elements that have
 * a `ccpa` attribute. Also, set the `CCPA-Notice` cookie to `given`. The
 * presence of this cookie is how we determine a "first visit". So in order
 * to hide the banner, just reload the page (or do it client-side).
 * 
 * **Disabling analytics scripts** 
 * 
 * Disabling analytics scripts (that use PII in cookies) works by finding 
 * and modifying elements that have a `uses-cookies` attribute. These elements
 * are modified as follows:
 * 
 * - If the element has a `src` attribute, change that attribute name to
 * `load-on-consent` in order not to load it. This works equally well for
 * scripts and img pixels, of course.
 * - If the element is a `script` and has no `src`, it must be an inline script.
 * In this case set the `type` attribute to `text/plain` in order not to
 * execute it as JS.
 * 
 * Both of the above can be leveraged on the client. When the user gives consent
 * you can load scripts by changing the attributes back to what they were.
 * If you get the consent answer on the client side, remember to set the
 * appropriate cookie (e.g. `GDPR-Consent) in the client code in order to
 * persist the answer.
 */
export const rewriteForConsent: ConsentRewriter = (event, response) => {
  return _rewriteForConsent(HTMLRewriter)(event, response);
};

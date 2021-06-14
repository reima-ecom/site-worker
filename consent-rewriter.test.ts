import "./worker-cloudflare-types.ts";
import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { _rewriteForConsent } from "./consent-rewriter.ts";

const makeFetchEvent = (
  cf: Partial<IncomingRequestCfProperties>,
  path: string = "/",
  cookie?: string,
) => {
  const request = new Request(`http://test.com${path}`);
  request.cf = cf as IncomingRequestCfProperties;
  if (cookie) request.headers.set("Cookie", cookie);
  return { request } as FetchEvent;
};

const getMockHTMLRewriter = () => {
  const onCalls: string[] = [];
  class MockHTMLRewriter {
    on(selector: string) {
      onCalls.push(selector);
      return this;
    }
    transform(res: Response) {
      return res;
    }
  }
  return {
    onCalls,
    Rewriter: MockHTMLRewriter as unknown as typeof HTMLRewriter,
  };
};

Deno.test("consent rewriter returns response in base case", () => {
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({}),
    new Response(),
  );
  assertEquals(htmlRewriter.onCalls.length, 0);
});

Deno.test("consent rewriter disables cookies and shows banner when finland", () => {
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ country: "FI" }),
    new Response(),
  );
  assertEquals(htmlRewriter.onCalls, ["[uses-cookies]", "[gdpr]"]);
});

Deno.test("consent rewriter sets cookie when `?gdpr-consent=` query string in finland", () => {
  const originResponse = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  const response = _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ country: "FI" }, "/?gdpr-consent=yes"),
    originResponse,
  );
  assertEquals(htmlRewriter.onCalls, []);
  assertMatch(response.headers.get("Set-Cookie") || "", /GDPR-Consent=yes/);
});

Deno.test("consent rewriter not called if consent given in cookie", () => {
  const response = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ country: "FI" }, "/", "GDPR-Consent=yes"),
    response,
  );
  assertEquals(htmlRewriter.onCalls, []);
});

Deno.test("consent rewriter disables analytics if consent rejected in cookie", () => {
  const response = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ country: "FI" }, "/", "GDPR-Consent=no"),
    response,
  );
  assertEquals(htmlRewriter.onCalls, ["[uses-cookies]"]);
});

Deno.test("consent rewriter disables analytics if consent rejected in qry string", () => {
  const response = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ country: "FI" }, "/?gdpr-consent=no"),
    response,
  );
  assertEquals(htmlRewriter.onCalls, ["[uses-cookies]"]);
});

Deno.test("consent rewriter shows banner and sets cookie for california", () => {
  const response = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ colo: "LAX" }),
    response,
  );
  assertEquals(htmlRewriter.onCalls, ["[ccpa]"]);
  assertMatch(response.headers.get("Set-Cookie") || "", /CCPA-Notice=given/);
});

Deno.test("consent rewriter doesn't rewrite for california when notice given", () => {
  const response = new Response();
  const htmlRewriter = getMockHTMLRewriter();
  _rewriteForConsent(htmlRewriter.Rewriter)(
    makeFetchEvent({ colo: "LAX" }, "/", "CCPA-Notice=given"),
    response,
  );
  assertEquals(htmlRewriter.onCalls, []);
});

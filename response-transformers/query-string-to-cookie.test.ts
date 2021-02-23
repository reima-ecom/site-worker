import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { queryStringToCookie } from "./query-string-to-cookie.ts";
import type { FetchEventHandler } from "../handler.ts";

const getAsset: FetchEventHandler = async ({ request }) => {
  return new Response("<p exp-test>This should be tested</p>", {
    headers: {
      "Content-Type": "text/html",
    },
  });
};

const makeFetchEvent = (path: string) =>
  ({
    request: new Request(`http://test.com${path}`),
  }) as FetchEvent;

Deno.test("query string to cookie sets cookie if qry string found", async () => {
  const handler = queryStringToCookie("a8", "X-Checkout-Attrs-A8", getAsset);
  const response = await handler(makeFetchEvent("/?a8=test"));
  assertMatch(response.headers.get("set-cookie")!, /X-Checkout-Attrs-A8=test/);
});

Deno.test("query string to cookie sets cookie if qry string found", async () => {
  const handler = queryStringToCookie("a8", "X-Checkout-Attrs-A8", getAsset);
  const response = await handler(makeFetchEvent("/test"));
  assertEquals(response.headers.has("set-cookie"), false);
});

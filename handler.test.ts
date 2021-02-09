import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { _getEventHandler } from "./handler.ts";
import { getRedirecter, Redirect } from "./redirecter.ts";

const makeFetchEvent = (path?: string) =>
  ({
    request: new Request(`http://test.com${path || "/"}`),
  }) as FetchEvent;

Deno.test("Returns response from asset getter", async () => {
  const handleEvent = _getEventHandler({
    getAsset: async () => new Response("moikka"),
    getRedirect: async () => undefined,
  });
  const resp = await handleEvent(makeFetchEvent());
  assertEquals(await resp.text(), "moikka");
});

const redirectMacro = (path: string, expectedLocation: string) =>
  async () => {
    const redirects: Redirect[] = [
      { from: "/blackfriday", to: "/coll/bf" },
      { from: "/blackfriday/", to: "/coll/bf" },
    ];
    const handleEvent = _getEventHandler({
      getAsset: async () => undefined,
      getRedirect: getRedirecter(redirects),
      stripTrailingSlash: true,
    });
    const resp = await handleEvent(makeFetchEvent(path));
    assertEquals(resp.headers.get("location"), expectedLocation);
    assertEquals(resp.status, 301);
  };

Deno.test(
  "Redirects to non-trailing slash if option set",
  redirectMacro("/prod/jacket/", "/prod/jacket"),
);
Deno.test(
  "Redirects to non-trailing with query string",
  redirectMacro("/prod/jacket/?hello=there", "/prod/jacket?hello=there"),
);
Deno.test(
  "Redirects regular query string",
  redirectMacro("/blackfriday/?hello=there", "/coll/bf?hello=there"),
);
Deno.test(
  "Redirects with getter",
  redirectMacro("/blackfriday", "/coll/bf"),
);
Deno.test(
  "Redirects trailing slash only once",
  redirectMacro("/blackfriday/", "/coll/bf"),
);

Deno.test("Does not redirect root", async () => {
  const handleEvent = _getEventHandler({
    getAsset: async () => new Response("root"),
    getRedirect: async () => undefined,
    stripTrailingSlash: true,
  });
  const resp = await handleEvent(makeFetchEvent());
  assertEquals(await resp.text(), "root");
});

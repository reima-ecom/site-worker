import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import {
  notFound404WhenTrailingSlash,
  redirectIfTrailingSlash,
} from "./trailing-slash-remover.ts";

const makeFetchEvent = (path: string) =>
  ({
    request: new Request(`http://test.com${path}`),
  }) as FetchEvent;

const redirectMacro = (
  path: string,
  expectedLocation: string,
) =>
  async () => {
    const resp = await redirectIfTrailingSlash(
      makeFetchEvent(path),
      new Response(),
    );
    assertEquals(resp?.headers.get("location"), expectedLocation);
    assertEquals(resp?.status, 301);
  };

Deno.test(
  "redirects to non-trailing slash if option set",
  redirectMacro("/prod/jacket/", "/prod/jacket"),
);
Deno.test(
  "redirects to non-trailing with query string",
  redirectMacro("/prod/jacket/?hello=there", "/prod/jacket?hello=there"),
);

Deno.test("non-trailing slash doesn't redirect root", async () => {
  const resp = await redirectIfTrailingSlash(
    makeFetchEvent("/"),
    new Response(),
  );
  assertEquals(resp, undefined);
});

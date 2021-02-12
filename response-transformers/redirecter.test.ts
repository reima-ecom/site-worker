import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { getRedirecter } from "./redirecter.ts";

const makeFetchEvent = (path: string) =>
  ({
    request: new Request(`http://test.com${path}`),
  }) as FetchEvent;

const redirectMacro = (pathname: string, redirectTo: string | undefined) => {
  const getRedirect = getRedirecter([
    { from: "/blackfriday", to: "/bf" },
    { from: "/slash/", to: "/s" },
    { from: "/coll/babies/*", to: "/coll/babies" },
    { from: "/coll/junior/*", to: "/coll/kids" },
  ]);
  return async () => {
    const redirect = await getRedirect(
      makeFetchEvent(pathname),
      new Response(undefined, { status: 404 }),
    );
    assertEquals(redirect?.headers.get("Location"), redirectTo);
  };
};

Deno.test(
  "Regular redirect works",
  redirectMacro("/blackfriday", "/bf"),
);
Deno.test(
  "Regular redirect works with trailing slash",
  redirectMacro("/blackfriday/", "/bf"),
);
Deno.test(
  "Redirect with trailng slash defined",
  redirectMacro("/slash", "/s"),
);
Deno.test(
  "Returns undefined when nothing found",
  redirectMacro("/notaredirect", undefined),
);
Deno.test(
  "Base case wildcard redirect",
  redirectMacro("/coll/babies/tags/small", "/coll/babies"),
);
Deno.test(
  "Path with slash",
  redirectMacro("/coll/junior/somepath/", "/coll/kids"),
);
Deno.test(
  "Path without slash",
  redirectMacro("/coll/junior/somepath", "/coll/kids"),
);
Deno.test(
  "Redirect base with slash",
  redirectMacro("/coll/junior/", "/coll/kids"),
);
Deno.test(
  "Redirect base without",
  redirectMacro("/coll/junior", "/coll/kids"),
);

Deno.test("returns undefined if response ok", async () => {
  const result = await getRedirecter([])(
    {} as unknown as FetchEvent,
    new Response(),
  );
  assertEquals(result, undefined);
});

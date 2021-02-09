import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { _getWildcardRedirectFinder } from "./redirecter.ts";

const redirectMacro = (pathname: string, redirectTo: string | undefined) => {
  const getRedirect = _getWildcardRedirectFinder(async (key) => {
    if (!key) throw new Error("No key specified!");
    //@ts-ignore
    return ({
      "/blackfriday": "/bf",
      "/slash/": "/s",
      "/coll/babies/*": "/coll/babies",
      "/coll/junior/*": "/coll/kids",
    }[key] || null);
  });
  return async () => {
    const redirect = await getRedirect(pathname);
    assertEquals(redirect, redirectTo);
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

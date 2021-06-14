import "../worker-types.ts";
import "../worker-cloudflare-types.ts";
import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { getCountryRedirecter } from "./country-redirecter.ts";

const createFetchEvent = (request: Request, country?: string): FetchEvent => {
  //@ts-ignore full cf object not needed
  if (country) request.cf = { country };
  //@ts-ignore full fetch event not needed
  return { request };
};

const redirect = getCountryRedirecter([{
  countryCode: "JP",
  subdirectory: "jp",
}]);

Deno.test("country redirecter returns undefined for request without country", async () => {
  const response = await redirect(
    createFetchEvent(new Request("https://fbb.com/")),
    new Response(),
  );
  assertEquals(response, undefined);
});

Deno.test("country redirecter returns undefined for request in correct subdir", async () => {
  const response = await redirect(
    createFetchEvent(new Request("https://fbb.com/jp/page/"), "JP"),
    new Response(),
  );
  assertEquals(response, undefined);
});

Deno.test("country redirecter returns undefined if already redirected (cookie)", async () => {
  const response = await redirect(
    createFetchEvent(
      new Request("https://fbb.com/jp/page/", {
        headers: { "Cookie": "Redirected=true" },
      }),
      "JP",
    ),
    new Response(),
  );
  assertEquals(response, undefined);
});

Deno.test("country redirecter returns 302 when redirectable country in subdir", async () => {
  const response = await redirect(
    createFetchEvent(new Request("https://fbb.com/jp-not/page/"), "JP"),
    new Response(),
  );
  if (!response) throw new Error("No response received");
  assertEquals(response.status, 302);
  assertEquals(response.headers.get("Location"), "/jp/");
  assertMatch(response.headers.get("Set-Cookie") || "", /Redirected=true/);
});

Deno.test("country redirecter returns 302 when redirectable country in root", async () => {
  const response = await redirect(
    createFetchEvent(new Request("https://fbb.com/"), "JP"),
    new Response(),
  );
  if (!response) throw new Error("No response received");
  assertEquals(response.status, 302);
  assertEquals(response.headers.get("Location"), "/jp/");
  assertMatch(response.headers.get("Set-Cookie") || "", /Redirected=true/);
});

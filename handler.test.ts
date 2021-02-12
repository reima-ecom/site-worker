import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { _getEventHandler } from "./handler.ts";

const makeFetchEvent = (path?: string) =>
  ({
    request: new Request(`http://test.com${path || "/"}`),
  }) as FetchEvent;

Deno.test("Returns response from asset getter", async () => {
  const handleEvent = _getEventHandler({
    getAsset: async () => new Response("moikka"),
  });
  const resp = await handleEvent(makeFetchEvent());
  assertEquals(await resp.text(), "moikka");
});

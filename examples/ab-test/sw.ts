import "../../worker-types.ts";
import { getEventListener, rewriteForTesting } from "../../mod.ts";
import type { FetchEventHandler } from "../../handler.ts";

const getAsset: FetchEventHandler = async ({ request }) => {
  if (new URL(request.url).pathname === "/") {
    return new Response("<p exp-test>This should be tested</p>", {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
  return new Response("This is a not found page", { status: 404 });
};

const eventListener = getEventListener({
  getAsset: getAsset,
  responseTransformers: [
    rewriteForTesting(["exp-test", "exp-not-found"]),
  ],
});

addEventListener("fetch", eventListener);

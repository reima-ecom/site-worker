import "../../worker-types.ts";
import { getEventListener } from "../../mod.ts";

const eventListener = getEventListener({
  getAsset: async (request) => {
    if (request.url.endsWith("/not-found")) return undefined;
    if (request.url.endsWith("/404.html")) {
      return new Response("This is a not found page");
    }
    return new Response("<p exp-test>This should be tested</p>", {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  enableExperiments: ["exp-test", "exp-not-found"],
});

addEventListener("fetch", eventListener);

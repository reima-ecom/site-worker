import "./worker-types.ts";
import redirects from "./redirects.json";
import { getEventHandler } from "./handler.ts";
import { fetchFromHost } from "./asset-proxy.ts";

const ttlOneDay = 1 * 60 * 60 * 24;

const MIME_TYPE_TO_TTL_MAP = {
  "image/jpeg": ttlOneDay,
  "image/png": ttlOneDay,
  "font/woff": ttlOneDay,
  "font/woff2": ttlOneDay,
  "application/javascript": ttlOneDay,
};

const eventHandler = getEventHandler({
  getAsset: fetchFromHost("reima-us.netlify.app"),
  getRedirect: getRedirectGetter(redirects),
}, {
  stripTrailingSlash: true,
});

addEventListener("fetch", (event) => {
  try {
    event.respondWith(eventHandler(event));
  } catch (e) {
    event.respondWith(new Response("Internal Error", { status: 500 }));
  }
});

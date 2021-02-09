import "./worker-types.ts";
import { getEventListener } from "./handler.ts";
import { fetchFromHost } from "./asset-proxy.ts";
import { getRedirecter } from "./redirecter.ts";
import type { Redirect } from "./redirecter.ts";

declare const __REDIRECTS: Redirect[];

const ttlOneDay = 1 * 60 * 60 * 24;

const MIME_TYPE_TO_TTL_MAP = {
  "image/jpeg": ttlOneDay,
  "image/png": ttlOneDay,
  "font/woff": ttlOneDay,
  "font/woff2": ttlOneDay,
  "application/javascript": ttlOneDay,
};

const eventListener = getEventListener({
  getAsset: fetchFromHost("reima-us.netlify.app"),
  getRedirect: getRedirecter(__REDIRECTS),
  stripTrailingSlash: true,
});

addEventListener("fetch", eventListener);

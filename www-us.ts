import "./worker-types.ts";
import { getEventListener } from "./handler.ts";
import { fetchFromHost } from "./asset-proxy.ts";
import { getRedirecter } from "./redirecter.ts";
import type { Redirect } from "./redirecter.ts";

declare const __REDIRECTS: Redirect[];

const eventListener = getEventListener({
  getAsset: fetchFromHost("reima-us.netlify.app"),
  getRedirect: getRedirecter(__REDIRECTS),
  stripTrailingSlash: true,
});

addEventListener("fetch", eventListener);

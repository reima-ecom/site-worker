import "../../worker-types.ts";
import {
  fetchFromHost,
  getEventListener,
  getRedirecter,
  Redirect,
} from "../../mod.ts";

declare const __REDIRECTS: Redirect[];

const eventListener = getEventListener({
  getAsset: fetchFromHost("reima-us.netlify.app"),
  getRedirect: getRedirecter(__REDIRECTS),
  stripTrailingSlash: true,
});

addEventListener("fetch", eventListener);

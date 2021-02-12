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
  responseTransformers: [
    getRedirecter(__REDIRECTS),
  ],
});

addEventListener("fetch", eventListener);

import "../../worker-types.ts";
import { fetchFromHost, getEventListener } from "../../mod.ts";

const eventListener = getEventListener({
  getAsset: fetchFromHost("reima-us.netlify.app"),
  enableExperiments: ["exp-klarna-banner"],
});

addEventListener("fetch", eventListener);

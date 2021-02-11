import { RequestHandler } from "./handler.ts";
import "./worker-types.ts";
export const rewriteForTesting = (
  experiments: string[],
  getAsset: RequestHandler,
  event: FetchEvent,
): RequestHandler =>
  (request) => {
    throw new Error("Not implemented");
  };

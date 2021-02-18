import { ConsentRewriter, rewriteForConsent } from "./consent-rewriter.ts";
import "./worker-types.ts";

export type FetchEventHandler = (
  event: FetchEvent,
) => Promise<Response>;

export type ResponseTransformer = (
  event: FetchEvent,
  response: Response,
) => Promise<Response | undefined>;

type EventHandlerOptions = {
  getAsset: FetchEventHandler;
  responseTransformers?: ResponseTransformer[];
};

export const _getEventHandler: (
  opts: EventHandlerOptions,
  consentRewriter?: ConsentRewriter,
) => FetchEventHandler = (
  { getAsset, responseTransformers },
  consentRewriter,
) =>
  async (event) => {
    // if this call throws, we don't have an asset to return
    // anyway, so just let it fail in that case
    let assetResponse = await getAsset(event);
    try {
      if (consentRewriter) {
        assetResponse = consentRewriter(
          event,
          assetResponse,
        );
      }
      if (responseTransformers) {
        for (const responseTransformer of responseTransformers) {
          const newResponse = await responseTransformer(event, assetResponse);
          if (newResponse) return newResponse;
        }
      }
      return assetResponse;
    } catch (error) {
      // set error header
      assetResponse = new Response(assetResponse.body, assetResponse);
      assetResponse.headers.append("Worker-Error", error.toString());
      return assetResponse;
    }
  };

export const getEventListener: (
  opts: EventHandlerOptions,
) => FetchEventListener = (options) => {
  const handleEvent = _getEventHandler(options, rewriteForConsent);
  return (event) => {
    event.respondWith(handleEvent(event));
  };
};

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
) => FetchEventHandler = (
  { getAsset, responseTransformers },
) =>
  async (event) => {
    const assetResponse = await getAsset(event);
    if (responseTransformers) {
      for (const responseTransformer of responseTransformers) {
        const newResponse = await responseTransformer(event, assetResponse);
        if (newResponse) return newResponse;
      }
    }
    return assetResponse;
  };

export const getEventListener: (
  opts: EventHandlerOptions,
) => FetchEventListener = (options) => {
  const handleEvent = _getEventHandler(options);
  return (event) => {
    event.respondWith(handleEvent(event));
  };
};

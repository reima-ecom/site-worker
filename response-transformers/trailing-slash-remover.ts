import { FetchEventHandler, ResponseTransformer } from "../handler.ts";

const _hasTrailingSlashAndNotRoot = (url: string) => {
  // get pathname and remove the slash in the beginning
  // so that the root `/` doesn't match
  return new URL(url).pathname.substring(1).endsWith("/");
};

export const notFound404WhenTrailingSlash = (
  getAsset: FetchEventHandler,
): FetchEventHandler =>
  async (event) => {
    if (_hasTrailingSlashAndNotRoot(event.request.url)) {
      return new Response("Trailing slashes not supported", { status: 404 });
    }
    return getAsset(event);
  };

export const redirectIfTrailingSlash: ResponseTransformer = async (event) => {
  if (_hasTrailingSlashAndNotRoot(event.request.url)) {
    const url = new URL(event.request.url);
    return new Response(
      "This site does not use trailing slashes for directories",
      {
        status: 301,
        headers: {
          "Location": url.pathname.slice(0, -1) + url.search,
        },
      },
    );
  }
};

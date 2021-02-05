export type FetchEventResponder = (event: FetchEvent) => Promise<Response>;

export type RedirectResult = {
  toPath: string;
  statusCode: 301 | 302 | undefined;
};

export type RedirectFinder = (
  pathname: string,
) => Promise<RedirectResult | undefined>;

export type RedirectResponder = (
  pathname: string,
) => Promise<Response | undefined>;

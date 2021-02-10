export type RedirectResult = {
  toPath: string;
  statusCode: 301 | 302 | undefined;
};

export type RedirectFinder = (
  pathname: string,
) => Promise<RedirectResult | undefined>;

export type RedirectHandler = (
  request: Request,
) => Promise<Response | undefined>;

export type Redirect = {
  from: string;
  to: string;
  code?: 301 | 302;
};

/**
 * Get a redirect getter (url to redirect) function when the source is an array of redirects.
 *
 * @param redirectsArray Array of redirects to search for
 */
export const _getRedirectGetter = (
  redirectsArray: Redirect[],
): RedirectFinder =>
  async (path) => {
    const redirect = redirectsArray.find((r) => r.from === path);
    if (!redirect) return undefined;
    return {
      toPath: redirect.to,
      statusCode: redirect.code,
    };
  };

/**
 * Factory for redirect getter with wildcard handling
 */
export const _getWildcardRedirectFinder = (
  getRedirect: RedirectFinder,
): RedirectFinder => {
  const findRedirect: RedirectFinder = async (pathWithoutSlash) =>
    // query for wildcard path
    await getRedirect(`${pathWithoutSlash}/*`) ||
    // query for slash ending path
    await getRedirect(`${pathWithoutSlash}/`) ||
    // query for non-slash path (defaulting to undefined if not found)
    // if this is the root, don't query with the empty string
    (pathWithoutSlash ? getRedirect(`${pathWithoutSlash}`) : undefined);

  return async (pathname) => {
    // create array of path segments
    const pathSegments = pathname.split("/");
    // filter out possible empty segment at the end
    // (if path is /some/path/, the array is ['', 'some', 'path', ''])
    if (!pathSegments[pathSegments.length - 1]) pathSegments.pop();
    // check this redirect
    do {
      const redirect = await findRedirect(pathSegments.join("/"));
      if (redirect) return redirect;
      // loop while there are items in the array
    } while (pathSegments.pop());
    return undefined;
  };
};

const _toResponse = (request: Request) =>
  (redirect?: RedirectResult): Response | undefined =>
    redirect
      ? new Response("Redirecting...", {
        status: redirect.statusCode || 301,
        headers: {
          "Location": redirect.toPath + new URL(request.url).search,
        },
      })
      : undefined;

const _getPathname = (request: Request): string =>
  new URL(request.url).pathname;

export const getRedirecter = (redirects: Redirect[]): RedirectHandler => {
  const getRedirect = _getWildcardRedirectFinder(_getRedirectGetter(redirects));
  return (request) =>
    Promise.resolve(request)
      .then(_getPathname)
      .then(getRedirect)
      .then(_toResponse(request));
};

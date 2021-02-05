import "./domain-types.ts";
import { RedirectFinder, RedirectResponder } from "./domain-types.ts";

/**
 * Factory for redirect getter with wildcard handling
 */
const getWildcardRedirectFinder = (
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

export default getWildcardRedirectFinder;

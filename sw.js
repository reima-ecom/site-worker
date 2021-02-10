__REDIRECTS = [{"from":"/test","to":"/"}];
const _hasTrailingSlashAndNotRoot = (url)=>{
    return new URL(url).pathname.substring(1).endsWith("/");
};
const _passthroughIfTrailingSlash = async (getAsset, request)=>{
    if (_hasTrailingSlashAndNotRoot(request.url)) {
        return undefined;
    }
    return getAsset(request);
};
const _redirectIfTrailingSlash = async (request)=>{
    if (_hasTrailingSlashAndNotRoot(request.url)) {
        const url = new URL(request.url);
        return new Response("This site does not use trailing slashes for directories", {
            status: 301,
            headers: {
                "Location": url.pathname.slice(0, -1) + url.search
            }
        });
    }
};
const _changeRequestUrlPath = (urlPath)=>(request)=>{
        const url = new URL(request.url);
        url.pathname = urlPath;
        return new Request(url.toString());
    }
;
const _getEventHandler = ({ getAsset , getRedirect , stripTrailingSlash  })=>async ({ request  })=>await (stripTrailingSlash ? _passthroughIfTrailingSlash(getAsset, request) : getAsset(request)) || await getRedirect(request) || await (stripTrailingSlash ? _redirectIfTrailingSlash(request) : undefined) || await Promise.resolve(request).then(_changeRequestUrlPath("/404.html")).then(getAsset) || new Response("Not found", {
            status: 404
        })
;
const getEventListener = (opts)=>{
    const handleEvent = _getEventHandler(opts);
    return (event)=>{
        event.respondWith(handleEvent(event));
    };
};
const fetchFromHost = (hostname)=>async (request)=>{
        const url = new URL(request.url);
        url.hostname = hostname;
        const lastPathSegment = url.pathname.split("/").pop();
        if (lastPathSegment && !lastPathSegment.includes(".")) url.pathname += "/";
        return fetch(url.toString());
    }
;
const _getRedirectGetter = (redirectsArray)=>async (path)=>{
        const redirect = redirectsArray.find((r)=>r.from === path
        );
        if (!redirect) return undefined;
        return {
            toPath: redirect.to,
            statusCode: redirect.code
        };
    }
;
const _getWildcardRedirectFinder = (getRedirect)=>{
    const findRedirect = async (pathWithoutSlash)=>await getRedirect(`${pathWithoutSlash}/*`) || await getRedirect(`${pathWithoutSlash}/`) || (pathWithoutSlash ? getRedirect(`${pathWithoutSlash}`) : undefined)
    ;
    return async (pathname)=>{
        const pathSegments = pathname.split("/");
        if (!pathSegments[pathSegments.length - 1]) pathSegments.pop();
        do {
            const redirect = await findRedirect(pathSegments.join("/"));
            if (redirect) return redirect;
        }while (pathSegments.pop())
        return undefined;
    };
};
const _toResponse = (request)=>(redirect)=>redirect ? new Response("Redirecting...", {
            status: redirect.statusCode || 301,
            headers: {
                "Location": redirect.toPath + new URL(request.url).search
            }
        }) : undefined
;
const _getPathname = (request)=>new URL(request.url).pathname
;
const getRedirecter = (redirects)=>{
    const getRedirect = _getWildcardRedirectFinder(_getRedirectGetter(redirects));
    return (request)=>Promise.resolve(request).then(_getPathname).then(getRedirect).then(_toResponse(request))
    ;
};
const eventListener = getEventListener({
    getAsset: fetchFromHost("reima-us.netlify.app"),
    getRedirect: getRedirecter(__REDIRECTS),
    stripTrailingSlash: true
});
addEventListener("fetch", eventListener);

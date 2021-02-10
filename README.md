# Site worker

Cloudflare worker for handling requests for file assets. Supports assets stored under a different hostname and assets stored in Cloudflare Worker KV store.

## Usage

```ts
// sw.ts

import {
  fetchFromHost,
  getEventListener,
  getRedirecter,
  Redirect,
} from "./mod.ts";

declare const __REDIRECTS: Redirect[];

const eventListener = getEventListener({
  getAsset: fetchFromHost("my-app.netlify.app"),
  getRedirect: getRedirecter(__REDIRECTS),
  stripTrailingSlash: true,
});

addEventListener("fetch", eventListener);
```

This example proxies requests to a different hostname, using the `fetchFromHost` handler. Redirects (with support for wildcard paths) are handled via `getRedirecter`. Finally, the optional `stripTrailingSlash` parameter is given, which means requests will be redirected from `/dir/path/` to `/dir/path`.

### Publishing

The above `sw.ts` file can just be bundled with Deno and published as-is with [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/commands#publish). Note that you need a `wrangler.toml` file for this.

However, the example uses an external JSON file as its redirects array. This JSON needs to be bundled into the worker script by inserting the JSON as the `__REDIRECTS` variable. This bundling can be performed using the `bundle-redirects-json.ts` script.

```bash
# create the initial bundle
> deno bundle sw.ts sw.js
# add the redirects variable
> deno run -A bundle-redirects-json.ts
# publish with wrangler
> wrangler publish
```
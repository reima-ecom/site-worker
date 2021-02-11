# Site worker

Cloudflare worker for handling requests for file assets. Supports assets stored under a different hostname and assets stored in Cloudflare Worker KV store.

## Basic usage

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

## A/B testing

You can A/B test with this event listener as well. Just pass in an array of strings with the `enableExperiments` parameter.

```ts
const eventListener = getEventListener({
  getAsset: fetcher,
  enableExperiments: ["exp-new-banner"],
});
```

### How it works

With the above experiment, the experimentation logic will set the `exp-new-banner` element attribute either to `treatment` or `control` where this attribute is found. Assuming a user in the treatment group, this is how a response from the `getAsset` function will be transformed:

```html
<!-- This html here -->
<p exp-new-banner>This element will be tested</p>
<!-- will be translated into -->
<p exp-new-banner="treatment">This element will be tested</p>
```

This means that for the element you want to test, just set an attribute that has the same name as your experiment. The name of the experiment will also be the name of the cookie. Thus, it is advisable to prefix your experiment names with e.g. `exp-`.

Then, in order to show the actual variants, just use a CSS attribute selector:

```css
[exp-new-banner=treatment] {
  color: red;
}
```

Naturally, the user id and experiment variation are persisted as cookies. **Note that persisting this user id (used only for experimentation) may have privacy implications.**
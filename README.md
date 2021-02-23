# Site worker

Cloudflare worker for handling requests for file assets. Supports assets stored under a different hostname and assets stored in Cloudflare Worker KV store.

## Basic usage

```ts
// sw.ts

import {
  fetchFromHost,
  getEventListener,
} from "./mod.ts";

const eventListener = getEventListener({
  getAsset: fetchFromHost("my-app.netlify.app"),
});

addEventListener("fetch", eventListener);
```

This example proxies requests to a different hostname, using the `fetchFromHost` event handler.

## Publishing

The above `sw.ts` file can just be bundled with Deno and published as-is with [wrangler](https://developers.cloudflare.com/workers/cli-wrangler/commands#publish). Note that you need a `wrangler.toml` and a `package.json` file for this (see wrangler docs or examples folder).

```bash
> deno bundle sw.ts sw.js
> wrangler publish
```

## Response transformation middleware

The event listener supports adding middleware in order to modify the response or to return a completely new response. Response transformers are added with the `responseTransformers` parameter of the `getEventListener` function. The transformers are fired sequentially, and can either work on the existing response (or e.g. just do some logging) and return `undefined` or return a completely new response. If a new response is returned, that response is immediately sent to the client and no more processing is done.

You can of course write any transformer you like, but there are a few pre-built ones that can be used:

### Redirects

The redirect transformer will search for a redirect for the current request path in the given array. It supports wildcards, e.g. `/old/*` and setting the status code per redirect. See the `examples/redirect` example.

The example uses an external JSON file as its redirects array. This JSON needs to be bundled into the worker script by inserting the JSON as the `__REDIRECTS` variable. This bundling can be performed using the `bundle-redirects-json.ts` script.

```bash
# create the initial bundle
> deno bundle sw.ts sw.js
# add the redirects variable
> deno run -A bundle-redirects-json.ts
# publish with wrangler
> wrangler publish
```

### A/B testing

The A/B testing transformer takes an array of experiment names and transforms the request body based on that using the `HTMLRewriter` API available in Cloudflare workers.

#### How it works

Given an array `["exp-new-banner"]`, the experimentation logic will set the `exp-new-banner` element attribute either to `treatment` or `control` where this attribute is found. Assuming a user in the treatment group, this is how a response from the `getAsset` function will be transformed:

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

### Trailing slash

In some cases it might be preferable to remove the trailing slash from URLs. This functionality can be achieved in two steps:

1. First wrap the `getAsset` function to return a 404 status for URLs ending in a slash
2. Add a response transformer that redirects pages with a trailing slash to an url without

The first step has no functional effect, but saves a call to the `getAsset` function when there is a trailing slash that will anyway be redirected.

```ts
const eventListener = getEventListener({
  getAsset: notFoundWhenTrailingSlash(getAsset),
  responseTransformers: [
    redirectIfTrailingSlash(),
  ],
});
```

See the examples for more details.

### Query string to cookie

You can store the value of a query string parameter with the `queryStringToCookie` helper. In order to set the value of the `a8` query string (search) parameter as the `X-A8` cookie, do the following:

```ts
const eventListener = getEventListener({
  getAsset: queryStringToCookie('a8', 'X-A8', getAsset),
});
```
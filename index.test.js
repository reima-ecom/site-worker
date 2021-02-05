import test from 'ava';
import fetch from 'node-fetch';
import getEventHandler from './index.js';

/** @type {typeof Response} */
// @ts-ignore
const MockResponse = fetch.Response;
/** @type {typeof Request} */
// @ts-ignore
const MockRequest = fetch.Request;
/** @type {(path?: string) => FetchEvent} */
// @ts-ignore
const makeFetchEvent = (path) => ({
  request: new MockRequest(`http://test.com${path || '/'}`),
});

test('Returns response from asset getter', async (t) => {
  const handleEvent = getEventHandler({
    getAssetFromKV: async () => new MockResponse('moikka'),
    getRedirect: undefined,
    Request: undefined,
    Response: undefined,
  });
  const resp = await handleEvent(makeFetchEvent());
  t.is(await resp.text(), 'moikka');
});

test('Calls asset getter with cache control option', async (t) => {
  const handleEvent = getEventHandler({
    getAssetFromKV: async (ev, { cacheControl }) => new MockResponse(cacheControl),
    getRedirect: undefined,
    Request: undefined,
    Response: undefined,
  }, {
    cacheControl: 'yes',
  });
  const resp = await handleEvent(makeFetchEvent());
  t.is(await resp.text(), 'yes');
});

const redirectMacro = async (t, input, expected) => {
  const redirects = {
    '/blackfriday': '/coll/bf',
    '/blackfriday/': '/coll/bf',
  };
  const handleEvent = getEventHandler({
    getAssetFromKV: undefined,
    getRedirect: (path) => redirects[path],
    Request: undefined,
    Response: MockResponse,
  }, {
    stripTrailingSlash: true,
  });
  const resp = await handleEvent(makeFetchEvent(input));
  t.is(resp.headers.get('location'), expected);
  t.is(resp.status, 301);
};

test('Redirects to non-trailing slash if option set',
  redirectMacro, '/prod/jacket/', '/prod/jacket');
test('Redirects with query string',
  redirectMacro, '/prod/jacket/?hello=there', '/prod/jacket?hello=there');
test('Redirects with getter',
  redirectMacro, '/blackfriday', '/coll/bf');
test('Redirects trailing slash only once',
  redirectMacro, '/blackfriday/', '/coll/bf');

test('Does not redirect root', async (t) => {
  const handleEvent = getEventHandler({
    getAssetFromKV: async () => new MockResponse('root'),
    getRedirect: undefined,
    Request: undefined,
    Response: MockResponse,
  }, {
    stripTrailingSlash: true,
  });
  const resp = await handleEvent(makeFetchEvent());
  t.is(await resp.text(), 'root');
});

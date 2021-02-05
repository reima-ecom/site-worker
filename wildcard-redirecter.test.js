import test from 'ava';
import getRedirectGetter from './wildcard-redirecter.js';

/** @type {import('ava').Macro<[string, string]>} */
const redirectMacro = async (t, input, expected) => {
  // @ts-ignore
  const getRedirect = getRedirectGetter(async (key) => {
    if (!key) throw new Error('No key specified!');
    return ({
      '/blackfriday': '/bf',
      '/slash/': '/s',
      '/coll/babies/*': '/coll/babies',
      '/coll/junior/*': '/coll/kids',
    }[key] || null);
  });
  const redirect = await getRedirect(input);
  t.is(redirect, expected);
};

test('Regular redirect works', redirectMacro, '/blackfriday', '/bf');
test('Regular redirect works with trailing slash', redirectMacro, '/blackfriday/', '/bf');
test('Redirect with trailng slash defined', redirectMacro, '/slash', '/s');
test('Returns undefined when nothing found', redirectMacro, '/notaredirect', undefined);
test('Base case wildcard redirect', redirectMacro, '/coll/babies/tags/small', '/coll/babies');
test('Path with slash', redirectMacro, '/coll/junior/somepath/', '/coll/kids');
test('Path without slash', redirectMacro, '/coll/junior/somepath', '/coll/kids');
test('Redirect base with slash', redirectMacro, '/coll/junior/', '/coll/kids');
test('Redirect base without', redirectMacro, '/coll/junior', '/coll/kids');

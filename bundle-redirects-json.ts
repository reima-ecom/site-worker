/**
 * Add `__REDIRECTS` as a variable into the specified file
 */

const redirectFile = "redirects.json";
const swFile = "sw.js";
const varName = "__REDIRECTS";

console.log(`Attempting to read ${redirectFile}...`);
const redircetsJson = await Deno.readTextFile(redirectFile);
console.log(`Attempting to read ${swFile}...`);
const workerJs = await Deno.readTextFile(swFile);
console.log(`Adding ${varName} variable to file...`);
// parsing and stringifying both to find errors and to minify
const minifiedRedirects = JSON.stringify(JSON.parse(redircetsJson));
const workerWithRedirects = `${varName} = ${minifiedRedirects};\n${workerJs}`;
console.log(`Overwriting ${swFile}...`);
await Deno.writeTextFile(swFile, workerWithRedirects);

export {};

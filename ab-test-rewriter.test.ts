import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.86.0/testing/asserts.ts";
import {
  _addAssetResponse,
  _addExperimentCookies,
  _addExperimentVariations,
  _transformForTesting,
  ExperimentElementHandler,
  Experiment,
} from "./ab-test-rewriter.ts";
import type { RequestHandler } from "./handler.ts";
import "./worker-cloudflare-types.ts";

Deno.test("ab tester reads and adds experiment cookies", () => {
  const experiments = ["exp-test"];
  const request = new Request("http://localhost", {
    headers: {
      "Cookie": "exp-test=control; exp-not=anymore",
    },
  });
  const results = _addExperimentVariations(experiments, request)({});
  assertEquals(results, {
    experiments: [{
      name: "exp-test",
      variation: "control",
    }],
  });
});

Deno.test("ab tester gets experiments not in cookie by random", () => {
  const experiments = ["exp"];
  const request = new Request("http://localhost");
  const results = _addExperimentVariations(experiments, request)({});
  if (!results.experiments) throw new Error(`Experiments not set`);
  const experimentVariation = results.experiments[0];
  assertEquals(experimentVariation.name, "exp");
  assertMatch(experimentVariation.variation, /^(?:treatment|control)$/);
});

Deno.test("ab tester adds asset response", async () => {
  const getAsset: RequestHandler = async () =>
    new Response(undefined, { statusText: "asset" });
  const results = await _addAssetResponse(
    getAsset,
    new Request("http://localhost"),
  )({ experiments: [] });
  assertEquals(results.response?.statusText, "asset");
  assertEquals(results.experiments, []);
});

Deno.test("cookie setter works for a single experiment", () => {
  const experiments = [{
    name: "exp-test",
    variation: "test",
  }];
  const originalResponse = new Response("body", { statusText: "transformed" });
  const result = _addExperimentCookies({
    experiments,
    response: originalResponse,
  });
  if (!result.response) throw new Error(`Response undefined`);
  assertEquals(result.response.statusText, "transformed");
  assertEquals(
    result.response.headers.get("Set-Cookie"),
    "exp-test=test; Max-Age=1209600; SameSite=Lax; Path=/",
  );
});

class MockHTMLRewriter {
  onCalls: string[] = [];
  on(selector: string) {
    this.onCalls.push(selector);
    return this;
  }
  onDocument() {}
  transform() {}
}

Deno.test("ab transformer calls on for each experiment", () => {
  const htmlRewriter = new MockHTMLRewriter();
  //@ts-ignore
  _transformForTesting(htmlRewriter as unknown as HTMLRewriter)({
    experiments: [
      { name: "exp-test", variation: "test" },
    ],
    response: new Response(),
    userId: "my-id",
  });
  assertEquals(htmlRewriter.onCalls, ["[exp-test]"]);
});

Deno.test("ab element handler sets attribute and execution", () => {
  const experiment: Experiment = {
    name: "exp",
    variation: "test",
  };
  const rewriter = new ExperimentElementHandler(experiment);
  let attributeName = "";
  let attributeValue = "";
  //@ts-ignore
  const element: Element = {
    setAttribute: (name, value) => {
      attributeName = name;
      attributeValue = value;
      return element;
    },
  };
  rewriter.element(element);
  assertEquals(attributeName, "exp");
  assertEquals(attributeValue, "test");
  assertEquals(experiment.executed, true);
});

import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { toElasticBulk } from "./ab-test-elastic.ts";

Deno.test("converts to elastic bulk without index", () => {
  const experiments = [
    {
      name: "exp-test",
      variation: "treatment",
      executed: true,
    },
    {
      name: "exp-not-executed",
      variation: "treatment",
    },
    {
      name: "exp-test-2",
      variation: "control",
      executed: true,
    },
  ];
  const expected = `{"index":{}}
{"userId":"user-id","experiment":"exp-test","variation":"treatment"}
{"index":{}}
{"userId":"user-id","experiment":"exp-test-2","variation":"control"}
`;
  assertEquals(toElasticBulk("user-id", experiments), expected);
});

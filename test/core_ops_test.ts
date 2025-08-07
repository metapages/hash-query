/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";

import {
  setHashParamValueInUrl,
  setHashParamsInUrl,
  getUrlHashParams,
  createHashParamValuesInHashString,
} from "../src/core/index.ts";

Deno.test({
  name: "Replace hash value with a prehash",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(
      testUrl,
      "hashkey1",
      "hashvalue1-replaced"
    ).href;
    assertEquals(
      resultUrl,
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1-replaced&hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Replace hash value without a prehash",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(
      testUrl,
      "hashkey1",
      "hashvalue1-replaced"
    ).href;
    assertEquals(
      resultUrl,
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1-replaced&hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Replace hash value with search params",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(
      testUrl,
      "hashkey1",
      "hashvalue1-replaced"
    ).href;
    assertEquals(
      resultUrl,
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1-replaced&hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Replace hash value with search params and prehash",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(
      testUrl,
      "hashkey1",
      "hashvalue1-replaced"
    ).href;
    assertEquals(
      resultUrl,
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1-replaced&hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Remove all hash params, no hash character: #, with search params",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1&hashkey2=hashvalue2";
    let resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);
    resultUrl = setHashParamValueInUrl(resultUrl, "hashkey2", undefined);
    assertEquals(resultUrl.href, "https://foo.com/?key1=val1&key2=val2");
  },
});

Deno.test({
  name: "Remove all hash params, no hash character: #",
  async fn() {
    const testUrl = "https://foo.com/";
    let resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);
    resultUrl = setHashParamValueInUrl(resultUrl, "hashkey2", undefined);
    assertEquals(resultUrl.href, "https://foo.com/");
  },
});

Deno.test({
  name: "Remove all hash params, no hash character: #, with search params, with prehash",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1&hashkey2=hashvalue2";
    let resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);
    resultUrl = setHashParamValueInUrl(resultUrl, "hashkey2", undefined);
    assertEquals(
      resultUrl.href,
      "https://foo.com/?key1=val1&key2=val2#prehashthing"
    );
  },
});

Deno.test({
  name: "Remove all hash params, no hash character: #, with prehash",
  async fn() {
    const testUrl =
      "https://foo.com/#prehashthing?hashkey1=hashvalue1&hashkey2=hashvalue2";
    let resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);
    resultUrl = setHashParamValueInUrl(resultUrl, "hashkey2", undefined);
    assertEquals(resultUrl.href, "https://foo.com/#prehashthing");
  },
});

Deno.test({
  name: "Remove one hash param, with search params, with prehash",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);

    assertEquals(
      resultUrl.href,
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Remove one hash param, with search params",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#?hashkey1=hashvalue1&hashkey2=hashvalue2";
    const resultUrl = setHashParamValueInUrl(testUrl, "hashkey1", undefined);

    assertEquals(
      resultUrl.href,
      "https://foo.com/?key1=val1&key2=val2#?hashkey2=hashvalue2"
    );
  },
});

Deno.test({
  name: "Set multiple hash params in URL at once",
  async fn() {
    const testUrl = "https://foo.com/?key1=val1&key2=val2#prehashthing";
    const params = {
      hashkey1: "value1",
      hashkey2: "value2",
      hashkey3: undefined, // This should be ignored/removed
    };

    const resultUrl = setHashParamsInUrl(testUrl, params);

    // Check that the URL structure is correct
    assertEquals(
      resultUrl.href,
      "https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=value1&hashkey2=value2"
    );

    // Verify that the parameters were set correctly by parsing them back
    const [preHash, hashParams] = getUrlHashParams(resultUrl);
    assertEquals(preHash, "prehashthing");
    assertEquals(hashParams.hashkey1, "value1");
    assertEquals(hashParams.hashkey2, "value2");
    assertEquals(hashParams.hashkey3, undefined);
  },
});

Deno.test({
  name: "Set multiple hash params with existing parameters",
  async fn() {
    const testUrl =
      "https://foo.com/?key1=val1&key2=val2#prehashthing?existingkey=existingvalue";
    const params = {
      newkey1: "newvalue1",
      newkey2: "newvalue2",
      existingkey: "updatedvalue", // This should update the existing parameter
    };

    const resultUrl = setHashParamsInUrl(testUrl, params);

    // Verify that the parameters were set correctly by parsing them back
    const [preHash, hashParams] = getUrlHashParams(resultUrl);
    assertEquals(Object.keys(hashParams).length, 3);
    assertEquals(preHash, "prehashthing");
    assertEquals(hashParams.newkey1, "newvalue1");
    assertEquals(hashParams.newkey2, "newvalue2");
    assertEquals(hashParams.existingkey, "updatedvalue");
  },
});

Deno.test({
  name: "createHashParamValuesInHashString edge cases",
  async fn() {
    // Test with empty hash
    const result1 = createHashParamValuesInHashString("", {
      key1: "value1",
      key2: "value2",
    });
    assertEquals(result1, "?key1=value1&key2=value2");

    // Test with only prehash
    const result2 = createHashParamValuesInHashString("#section", {
      key1: "value1",
      key2: "value2",
    });
    assertEquals(result2, "section?key1=value1&key2=value2");

    // Test with undefined values (should remove them)
    const result3 = createHashParamValuesInHashString(
      "#section?key1=oldvalue&key2=keepvalue",
      {
        key1: undefined,
        key3: "newvalue",
      }
    );
    assertEquals(result3, "section?key2=keepvalue&key3=newvalue");

    // Test with no changes
    const result4 = createHashParamValuesInHashString("#section?key1=value1", {
      key1: "value1",
    });
    assertEquals(result4, "#section?key1=value1");
  },
});

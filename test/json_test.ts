/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";

import {
  blobToBase64String,
  setHashParamValueJsonInUrl,
} from "../src/core/index.ts";

Deno.test({
  name: "Replace json value, with a prehash",
  async fn() {
    const jsonObject = {
      foo: "bar",
      1: true,
    };
    const testUrl = "https://foo.com/?key1=val1&key2=val2#prehashthing";
    const resultUrl = setHashParamValueJsonInUrl(
      testUrl,
      "hashkey1",
      jsonObject
    );
    const hashString = blobToBase64String(jsonObject);
    assertEquals(
      resultUrl.href,
      `https://foo.com/?key1=val1&key2=val2#prehashthing?hashkey1=${hashString}`
    );
  },
});

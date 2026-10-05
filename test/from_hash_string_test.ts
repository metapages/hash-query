/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";

import {
  getHashParamValueBase64DecodedFromHashString,
  getHashParamValueBase64DecodedFromUrl,
  getHashParamValueBooleanFromHashString,
  getHashParamValueFloatFromHashString,
  getHashParamValueFromHashString,
  getHashParamValueIntFromHashString,
  getHashParamValueUriDecodedFromHashString,
  stringToBase64String,
} from "../src/core/index.ts";

// Each `*FromHashString` getter must agree with its `*FromUrl` sibling on
// ordinary input — they differ only in what they accept, never in what they
// decode.
Deno.test({
  name: "FromHashString getters decode every value type",
  fn() {
    const hash = [
      "#?raw=plain",
      "num=1.5",
      "count=42",
      "flag=true",
      `b64=${stringToBase64String("hello ✓")}`,
      `uri=${encodeURIComponent("a&b=c")}`,
    ].join("&");

    assertEquals(getHashParamValueFromHashString(hash, "raw"), "plain");
    assertEquals(getHashParamValueFloatFromHashString(hash, "num"), 1.5);
    assertEquals(getHashParamValueIntFromHashString(hash, "count"), 42);
    assertEquals(getHashParamValueBooleanFromHashString(hash, "flag"), true);
    assertEquals(
      getHashParamValueBase64DecodedFromHashString(hash, "b64"),
      "hello ✓",
    );
    assertEquals(
      getHashParamValueUriDecodedFromHashString(hash, "uri"),
      "a&b=c",
    );
  },
});

Deno.test({
  name: "FromHashString getters return undefined for a missing key",
  fn() {
    const hash = "#?present=1";
    assertEquals(getHashParamValueFromHashString(hash, "absent"), undefined);
    assertEquals(
      getHashParamValueBase64DecodedFromHashString(hash, "absent"),
      undefined,
    );
    assertEquals(
      getHashParamValueUriDecodedFromHashString(hash, "absent"),
      undefined,
    );
  },
});

Deno.test({
  name: "FromHashString accepts a bare param string with no leading #? too",
  fn() {
    assertEquals(getHashParamValueFromHashString("?a=1&b=2", "b"), "2");
    assertEquals(getHashParamValueFromHashString("#?a=1&b=2", "b"), "2");
  },
});

// The reason these getters exist. Firefox's url parser hard-caps at 1 MiB
// (`network.standard-url.max-length`) and `new URL()` THROWS past it, so
// reading one param by synthesizing a url out of all of them crashes on an
// oversize NEIGHBOUR — in Firefox only, which is how this reached production.
// Deno's parser has no such cap, so this cannot assert the throw; it asserts
// the property that makes the throw impossible: the hash-string getters read a
// multi-megabyte param set without ever constructing a URL.
Deno.test({
  name: "FromHashString reads a param set far past Firefox's 1 MiB url cap",
  fn() {
    const FIREFOX_MAX_URL_CHARS = 1024 * 1024;
    const huge = stringToBase64String("x".repeat(2 * FIREFOX_MAX_URL_CHARS));
    const hash = `#?js=${huge}&css=${stringToBase64String("body{}")}`;

    if (hash.length <= FIREFOX_MAX_URL_CHARS) {
      throw new Error("fixture is too small to exercise the limit");
    }

    // Reading the SMALL param out of a set dominated by a huge one is the exact
    // shape that crashed: applyCssFromUrl read `css` and died on `js`.
    assertEquals(
      getHashParamValueBase64DecodedFromHashString(hash, "css"),
      "body{}",
    );
    assertEquals(
      getHashParamValueBase64DecodedFromHashString(hash, "js")?.length,
      2 * FIREFOX_MAX_URL_CHARS,
    );

    // Same values, same decode, via a url — allowed here only because Deno's
    // parser has no cap. Pins that the two forms agree.
    const url = `https://example.com/${hash}`;
    assertEquals(
      getHashParamValueBase64DecodedFromUrl(url, "css"),
      getHashParamValueBase64DecodedFromHashString(hash, "css"),
    );
  },
});

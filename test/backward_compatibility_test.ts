/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';

import {
  blobFromBase64String,
  stringFromBase64String,
  stringToBase64String
} from '../src/core/index.ts';

// Deno.test({
//   name: "Backward compatibility with old double-encoded JSON objects",
//   async fn() {
//     // Test data
//     const jsonObject = {
//       foo: "bar",
//       1: true,
//     };

//     // Simulate old double-encoded format
//     // Old format: btoa(encodeURIComponent(JSON.stringify(obj)))
//     const oldFormatBase64 = btoa(encodeURIComponent(JSON.stringify(jsonObject)));
//     console.log("Old format base64:", oldFormatBase64);
//     const url = `https://foo.com/#?key1=${oldFormatBase64}`;

//     const valueBack = getHashParamValueJsonFromUrl(url, "key1");
//     assertEquals(valueBack, jsonObject, "Old format should decode correctly");

//     // Test that old format can be decoded correctly
//     // const decodedFromOld = blobFromBase64String(oldFormatBase64);
//     // assertEquals(decodedFromOld, jsonObject, "Old format should decode correctly");

//     // Test that new format can be decoded correctly
//     const newFormatBase64 = blobToBase64String(jsonObject);
//     console.log("New format base64:", newFormatBase64);

//     const decodedFromNew = blobFromBase64String(newFormatBase64);
//     assertEquals(decodedFromNew, jsonObject, "New format should decode correctly");

//     // Test that both formats are different (as expected)
//     assertEquals(oldFormatBase64 !== newFormatBase64, true, "Old and new formats should be different");
//   },
// });

Deno.test({
  name: "Backward compatibility with URL-encoded old format in hash parameters",
  async fn() {
    const jsonObject = {
      test: "data",
      number: 42,
    };

    // Create old format base64 (double-encoded)
    const oldFormatBase64 = btoa(encodeURIComponent(JSON.stringify(jsonObject)));
    
    // Simulate URL encoding that would happen in hash parameters
    const urlEncodedOldFormat = encodeURIComponent(oldFormatBase64);
    
    // Test that the URL-encoded old format can be decoded correctly
    const decodedFromUrlEncoded = blobFromBase64String(urlEncodedOldFormat);
    assertEquals(decodedFromUrlEncoded, jsonObject, "URL-encoded old format should decode correctly");
  },
});

Deno.test({
  name: "String encoding/decoding backward compatibility",
  async fn() {
    const testString = "Hello, World!";
    
    // Test old format (double-encoded)
    const oldFormat = btoa(encodeURIComponent(testString));
    const decodedFromOld = stringFromBase64String(oldFormat);
    assertEquals(decodedFromOld, testString, "Old format string should decode correctly");
    
    // Test new format (single-encoded)
    const newFormat = stringToBase64String(testString);
    const decodedFromNew = stringFromBase64String(newFormat);
    assertEquals(decodedFromNew, testString, "New format string should decode correctly");
  },
});

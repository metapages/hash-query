/// <reference lib="deno.ns" />

// Deno.test({
//   name: "Performance test - optimized hash parameter processing",
//   async fn() {
//     const iterations = 10000;

//     // Test data
//     const jsonObject = {
//       foo: "bar",
//       1: true,
//       nested: {
//         value: "test",
//         array: [1, 2, 3, 4, 5],
//       },
//     };

//     const oldFormatBase64 = btoa(
//       encodeURIComponent(JSON.stringify(jsonObject))
//     );
//     const newFormatBase64 = blobToBase64String(jsonObject);

//     // Test strings
//     const regularString = "hello world";
//     const base64String = "SGVsbG8gV29ybGQ=";
//     const urlEncodedString = "hello%20world";

//     console.log(`Running ${iterations} iterations for each test...`);

//     // Test 1: Base64 decoding performance (with backward compatibility)
//     console.log("\n1. Base64 decoding performance:");

//     const start1 = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       // Test old format decoding (backward compatibility)
//       blobFromBase64String(oldFormatBase64);
//       // Test new format decoding
//       blobFromBase64String(newFormatBase64);
//     }
//     const end1 = performance.now();
//     console.log(`   Base64 decoding: ${(end1 - start1).toFixed(2)}ms`);

//     // Test 2: Hash parameter parsing performance
//     console.log("\n2. Hash parameter parsing performance:");

//     const testHash = `#prehash?key1=${encodeURIComponent(
//       regularString
//     )}&key2=${base64String}&key3=${oldFormatBase64}&key4=${newFormatBase64}`;

//     const start2 = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       getUrlHashParamsFromHashString(testHash);
//     }
//     const end2 = performance.now();
//     console.log(`   Hash parsing: ${(end2 - start2).toFixed(2)}ms`);

//     // Test 3: Hash parameter writing performance
//     console.log("\n3. Hash parameter writing performance:");

//     const start3 = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       setHashParamValueInHashString("#prehash", "key1", regularString);
//       setHashParamValueInHashString("#prehash", "key2", base64String);
//       setHashParamValueInHashString("#prehash", "key3", oldFormatBase64);
//       setHashParamValueInHashString("#prehash", "key4", newFormatBase64);
//     }
//     const end3 = performance.now();
//     console.log(`   Hash writing: ${(end3 - start3).toFixed(2)}ms`);

//     // Test 4: Multiple hash parameters performance (new vs old approach)
//     console.log("\n4. Multiple hash parameters performance:");

//     const multipleParams = {
//       key1: regularString,
//       key2: base64String,
//       key3: oldFormatBase64,
//       key4: newFormatBase64,
//       key5: "another value",
//       key6: "yet another",
//     };

//     // Test old approach (calling setHashParamValueInHashString repeatedly)
//     const start4a = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       let currentHash = "#prehash";
//       for (const [key, value] of Object.entries(multipleParams)) {
//         currentHash = setHashParamValueInHashString(currentHash, key, value);
//       }
//     }
//     const end4a = performance.now();
//     console.log(
//       `   Old approach (repeated calls): ${(end4a - start4a).toFixed(2)}ms`
//     );

//     // Test new approach (using createHashParamValuesInHashString)
//     const start4b = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       createHashParamValuesInHashString("#prehash", multipleParams);
//     }
//     const end4b = performance.now();
//     console.log(
//       `   New approach (single call): ${(end4b - start4b).toFixed(2)}ms`
//     );

//     // Test 5: String encoding/decoding performance
//     console.log("\n5. String encoding/decoding performance:");

//     const start5 = performance.now();
//     for (let i = 0; i < iterations; i++) {
//       stringToBase64String(regularString);
//       stringFromBase64String(base64String);
//     }
//     const end5 = performance.now();
//     console.log(`   String encoding/decoding: ${(end5 - start5).toFixed(2)}ms`);

//     const totalTime =
//       end1 -
//       start1 +
//       (end2 - start2) +
//       (end3 - start3) +
//       (end4b - start4b) +
//       (end5 - start5);
//     const totalOperations = iterations * 5;

//     console.log(
//       `\nTotal time: ${totalTime.toFixed(
//         2
//       )}ms for ${totalOperations} operations`
//     );
//     console.log(
//       `Average time per operation: ${(totalTime / totalOperations).toFixed(
//         4
//       )}ms`
//     );

//     // Performance improvement calculation
//     const oldTime = end4a - start4a;
//     const newTime = end4b - start4b;
//     const improvement = ((oldTime - newTime) / oldTime) * 100;
//     console.log(
//       `\nMultiple hash params performance improvement: ${improvement.toFixed(
//         1
//       )}% faster`
//     );
//   },
// });

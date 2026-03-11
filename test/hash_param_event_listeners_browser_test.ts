/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { delay } from "@std/async/delay";

import {
  addEventListenerHashParamBase64,
  addEventListenerHashParamBoolean,
  addEventListenerHashParamFloat,
  addEventListenerHashParamInt,
  addEventListenerHashParamJson,
  addEventListenerHashParamUriEncoded,
  setHashParamValueBase64EncodedInWindow,
  setHashParamValueBooleanInWindow,
  setHashParamValueFloatInWindow,
  setHashParamValueIntInWindow,
  setHashParamValueJsonInWindow,
  setHashParamValueUriEncodedInWindow,
} from "../src/core/index.ts";

const flushTick = async () => {
  await delay(5);
};

const setupBrowserGlobals = () => {
  const originalWindow = (globalThis as Record<string, unknown>).window;
  const originalLocation = (globalThis as Record<string, unknown>).location;
  const originalHistory = (globalThis as Record<string, unknown>).history;
  const originalDocument = (globalThis as Record<string, unknown>).document;
  const originalHashChangeEvent = (globalThis as Record<string, unknown>)
    .HashChangeEvent;

  if (typeof (globalThis as Record<string, unknown>).window === "undefined") {
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
      writable: true,
    });
  }

  let locationRef = new URL("https://example.com/");
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    get: () => locationRef,
    set: (next: URL) => {
      locationRef = next;
    },
  });

  Object.defineProperty(globalThis, "history", {
    value: {
      replaceState: (_state: unknown, _title: string, url: string) => {
        locationRef = new URL(url, locationRef.origin);
      },
    },
    configurable: true,
    writable: true,
  });

  if (typeof (globalThis as Record<string, unknown>).document === "undefined") {
    Object.defineProperty(globalThis, "document", {
      value: { title: "test" },
      configurable: true,
      writable: true,
    });
  }

  if (
    typeof (globalThis as Record<string, unknown>).HashChangeEvent ===
    "undefined"
  ) {
    class HashChangeEventPolyfill extends Event {}
    Object.defineProperty(globalThis, "HashChangeEvent", {
      value: HashChangeEventPolyfill,
      configurable: true,
      writable: true,
    });
  }

  return () => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "location", {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "history", {
      value: originalHistory,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "HashChangeEvent", {
      value: originalHashChangeEvent,
      configurable: true,
      writable: true,
    });
  };
};

Deno.test({
  name: "hash param listeners fire once after tick and stop after dispose",
  async fn() {
    const restore = setupBrowserGlobals();
    try {
      const runListenerCase = async <T>(
        key: string,
        initialValue: T,
        nextValue: T,
        setValue: (key: string, value: T | undefined) => void,
        addListener: (
          key: string,
          listener: (value: T | undefined) => void
        ) => () => void,
        expectedAfterDelete: T | undefined
      ) => {
        const values: Array<T | undefined> = [];
        setValue(key, initialValue);
        const dispose = addListener(key, (value) => values.push(value));

        await flushTick();
        assertEquals(values, [initialValue]);

        setValue(key, nextValue);
        await flushTick();
        assertEquals(values, [initialValue, nextValue]);

        setValue(key, undefined);
        await flushTick();
        assertEquals(values, [initialValue, nextValue, expectedAfterDelete]);

        dispose();
        setValue(key, initialValue);
        await flushTick();
        assertEquals(values, [initialValue, nextValue, expectedAfterDelete]);
      };

      await runListenerCase(
        "base64",
        "hello",
        "goodbye",
        setHashParamValueBase64EncodedInWindow,
        addEventListenerHashParamBase64,
        undefined
      );

      const booleanValues: Array<boolean | undefined> = [];
      setHashParamValueBooleanInWindow("boolean", true);
      const disposeBoolean = addEventListenerHashParamBoolean("boolean", (v) =>
        booleanValues.push(v)
      );
      await flushTick();
      assertEquals(booleanValues, [true]);
      setHashParamValueBooleanInWindow("boolean", undefined);
      await flushTick();
      assertEquals(booleanValues, [true, false]);
      disposeBoolean();
      setHashParamValueBooleanInWindow("boolean", true);
      await flushTick();
      assertEquals(booleanValues, [true, false]);

      await runListenerCase(
        "float",
        3.14,
        6.28,
        setHashParamValueFloatInWindow,
        addEventListenerHashParamFloat,
        undefined
      );

      await runListenerCase(
        "int",
        42,
        99,
        setHashParamValueIntInWindow,
        addEventListenerHashParamInt,
        undefined
      );

      const jsonInitial = { nested: { count: 1 }, arr: [1, 2, 3] };
      const jsonNext = { nested: { count: 2 }, arr: [4, 5, 6] };
      await runListenerCase<typeof jsonInitial>(
        "json",
        jsonInitial,
        jsonNext,
        setHashParamValueJsonInWindow,
        addEventListenerHashParamJson,
        undefined
      );

      await runListenerCase(
        "uri",
        "a value with spaces/%",
        "next/value",
        setHashParamValueUriEncodedInWindow,
        addEventListenerHashParamUriEncoded,
        undefined
      );
    } finally {
      restore();
    }
  },
});

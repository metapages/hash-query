import { useCallback, useEffect, useState } from "react";
import {
  getHashParamFromWindow,
  getHashParamsFromWindow,
  setHashParamInWindow,
  SetHashParamOpts,
} from "../core";

/**
 * Hook for getting/setting hash params
 */
export const useHashParam = (
  key: string,
  defaultValue?: string
): [
  string | undefined,
  (v: string | undefined, opts?: SetHashParamOpts) => void
] => {
  const [hashParam, setHashParamInternal] = useState<string | undefined>(
    getHashParamFromWindow(key) ?? defaultValue
  );

  useEffect(() => {
    const [_, hashParams] = getHashParamsFromWindow();
    if (defaultValue && hashParams[key] === undefined) {
      setHashParamInWindow(key, defaultValue);
    }
  }, [key, defaultValue]);

  // Listen for hash changes (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onHashChange = (_: HashChangeEvent) => {
      const paramHash = getHashParamsFromWindow()[1];
      setHashParamInternal(paramHash[key]);
    };
    globalThis.addEventListener("hashchange", onHashChange);
    return () => globalThis.removeEventListener("hashchange", onHashChange);
  }, [key]);

  const setParam: (v: string | undefined) => void = useCallback(
    (value: string | undefined, opts?: SetHashParamOpts) => {
      setHashParamInWindow(key, value, opts);
    },
    [key]
  );

  return [hashParam, setParam];
};

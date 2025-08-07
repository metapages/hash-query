import { useCallback, useEffect, useState } from "react";

import { SetHashParamOpts } from "../core";
import { useHashParam } from "./useHashParam";

/**
 * Hook for getting/setting a hash param boolean (safely encoded)
 */
export const useHashParamBoolean = (
  key: string
): [
  boolean | undefined,
  (v: boolean | undefined, opts?: SetHashParamOpts) => void
] => {
  const [hashParamString, setHashParamString] = useHashParam(key);
  const [hashBoolean, setHashBoolean] = useState<boolean>(
    hashParamString === "true" ? true : false
  );

  // if the hash string value changes
  useEffect(() => {
    setHashBoolean(hashParamString === "true" ? true : false);
  }, [key, hashParamString, setHashBoolean]);

  const setBoolean = useCallback(
    (val: boolean | undefined, opts?: SetHashParamOpts) => {
      val = !!val;
      if (val) {
        setHashParamString("true", opts);
      } else {
        setHashParamString(undefined, opts);
      }
    },
    [setHashParamString]
  );

  return [hashBoolean, setBoolean];
};

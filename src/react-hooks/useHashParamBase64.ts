import { useCallback, useEffect, useState } from "react";

import { useHashParam } from "./useHashParam";
import {
  SetHashParamOpts,
  stringFromBase64String,
  stringToBase64String,
} from "../core";

/**
 * Hook for getting/setting hash param string value, but base64 encoded
 * because it might be complex text
 */
export const useHashParamBase64 = (
  key: string,
  defaultValue?: string
): [
  string | undefined,
  (v: string | undefined, opts?: SetHashParamOpts) => void
] => {
  const [hashParamString, setHashParamString] = useHashParam(
    key,
    defaultValue !== undefined && defaultValue !== null
      ? stringToBase64String(defaultValue)
      : undefined
  );
  const [decodedString, setDecodedString] = useState<string | undefined>(() => {
    // Initialize with the current hash param value or default
    const initialValue = hashParamString
      ? stringFromBase64String(hashParamString)
      : defaultValue;
    return initialValue;
  });

  // if the hash string value changes
  useEffect(() => {
    const newValue = hashParamString
      ? stringFromBase64String(hashParamString)
      : defaultValue;
    setDecodedString(newValue);
  }, [key, hashParamString, defaultValue]);

  const encodeAndSetStringParam = useCallback(
    (rawString: string | undefined, opts?: SetHashParamOpts) => {
      if (rawString === null || rawString === undefined) {
        setHashParamString(undefined, opts);
      } else {
        const base64Json = stringToBase64String(rawString);
        setHashParamString(base64Json, opts);
      }
    },
    [setHashParamString]
  );

  return [decodedString, encodeAndSetStringParam];
};

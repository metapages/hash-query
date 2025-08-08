import { useCallback, useEffect, useState } from "react";

import { SetHashParamOpts } from "../core";
import { useHashParam } from "./useHashParam";

/**
 * Hook for getting/setting hash param string value, but base64 encoded
 * because it might be complex text
 */
export const useHashParamUriEncoded = (
  key: string,
  defaultValue?: string
): [
  string | undefined,
  (v: string | undefined, opts?: SetHashParamOpts) => void
] => {
  const [hashParamString, setHashParamString] = useHashParam(
    key,
    defaultValue !== undefined && defaultValue !== null
      ? encodeURIComponent(defaultValue)
      : undefined
  );
  const [decodedString, setDecodedString] = useState<string | undefined>(() => {
    // Initialize with the current hash param value or default
    const initialValue = hashParamString
      ? decodeURIComponent(hashParamString)
      : defaultValue;
    return initialValue;
  });

  // if the hash string value changes
  useEffect(() => {
    const newValue = hashParamString
      ? decodeURIComponent(hashParamString)
      : defaultValue;
    setDecodedString(newValue);
  }, [key, hashParamString, defaultValue]);

  const encodeAndSetStringParam = useCallback(
    (rawString: string | undefined, opts?: SetHashParamOpts) => {
      if (rawString === null || rawString === undefined) {
        setHashParamString(undefined, opts);
      } else {
        const encoded = encodeURIComponent(rawString);
        setHashParamString(encoded, opts);
      }
    },
    [setHashParamString]
  );

  return [decodedString, encodeAndSetStringParam];
};

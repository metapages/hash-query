import { useCallback, useEffect, useState } from "react";
import { useHashParam } from "./useHashParam";
import {
  blobFromBase64String,
  blobToBase64String,
  SetHashParamOpts,
} from "../core";

/**
 * Hook for getting/setting a hash param JSON blob (safely encoded)
 */
export const useHashParamJson = <T>(
  key: string,
  defaultBlob?: T
): [T | undefined, (v?: T | undefined, opts?: SetHashParamOpts) => void] => {
  const [hashParamString, setHashParamString] = useHashParam(
    key,
    defaultBlob !== undefined && defaultBlob !== null
      ? blobToBase64String(defaultBlob)
      : undefined
  );

  const [hashBlob, setHashBlob] = useState<T>(
    blobFromBase64String(hashParamString)
  );

  // if the hash string value changes
  useEffect(() => {
    setHashBlob(blobFromBase64String(hashParamString));
  }, [key, hashParamString, setHashBlob]);

  const setJsonBlob = useCallback(
    (blob?: T | undefined, opts?: SetHashParamOpts) => {
      if (blob === null || blob === undefined) {
        setHashParamString(undefined, opts);
      } else {
        const base64Json = blobToBase64String(blob);
        setHashParamString(base64Json, opts);
      }
    },
    [setHashParamString]
  );

  return [hashBlob, setJsonBlob];
};

import { useCallback, useEffect, useState } from "react";
import { useHashParam } from "./useHashParam";
import { SetHashParamOpts } from "../core";

/**
 * Hook for getting/setting a hash param float (safely encoded)
 */
export const useHashParamFloat = (
  key: string,
  defaultValue?: number
): [
  number | undefined,
  (v: number | undefined, opts?: SetHashParamOpts) => void
] => {
  const [hashParamString, setHashParamString] = useHashParam(
    key,
    defaultValue !== undefined && defaultValue !== null
      ? defaultValue.toString()
      : undefined
  );
  const [hashNumber, setHashNumber] = useState<number | undefined>(() => {
    // Initialize with the current hash param value or default
    const initialValue = hashParamString
      ? parseFloat(hashParamString)
      : defaultValue;
    return initialValue;
  });

  // if the hash string value changes
  useEffect(() => {
    const newValue = hashParamString
      ? parseFloat(hashParamString)
      : defaultValue;
    setHashNumber(newValue);
  }, [key, hashParamString, defaultValue]);

  const setNumber = useCallback(
    (val: number | undefined, opts?: SetHashParamOpts) => {
      if (val) {
        setHashParamString(val.toString(), opts);
      } else {
        setHashParamString(undefined, opts);
      }
    },
    [setHashParamString]
  );

  return [hashNumber, setNumber];
};

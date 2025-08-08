/**
 * Core logic for getting/setting hash params
 * Important note: the internal hash string does NOT have the leading #
 */

import stringify from "fast-json-stable-stringify";

export type SetHashParamOpts = {
  modifyHistory?: boolean;
};

export const blobToBase64String = (blob: Record<string, any>) => {
  return stringToBase64String(stringify(blob));
};

export const blobFromBase64String = (value: string | undefined) => {
  if (value && value.length > 0) {
    const blob = JSON.parse(stringFromBase64String(value));
    return blob;
  }
  return undefined;
};

export const stringToBase64String = (value: string): string => {
  return btoa(value);
};

export const stringFromBase64String = (value: string): string => {
  //github.com/metapages/metaframe-js/issues/11
  while (value.endsWith("%3D")) {
    value = value.slice(0, -3);
  }

  // Only handle backward compatibility for old double-encoded data
  try {
    const base64Decoded = atob(value);
    // Check if this is old double-encoded data (contains % characters)
    if (base64Decoded.indexOf("%") !== -1) {
      // This is old double-encoded data, need to decode URI component
      return decodeURIComponent(base64Decoded);
    } else {
      // This is regular base64 data, just return the decoded content
      return base64Decoded;
    }
  } catch (error) {
    // If atob fails, throw the error
    throw error;
  }
};

// Get everything after # then after ?
export const getUrlHashParams = (
  url: string | URL
): [string, Record<string, string>] => {
  const urlBlob = url instanceof URL ? url : new URL(url);
  return getUrlHashParamsFromHashString(urlBlob.hash);
};

export const getUrlHashParamsFromHashString = (
  hash: string
): [string, Record<string, string>] => {
  let hashString = hash;
  while (hashString.startsWith("#")) {
    hashString = hashString.substring(1);
  }

  const queryIndex = hashString.indexOf("?");
  if (queryIndex === -1) {
    return [hashString, {}];
  }
  const preHashString = hashString.substring(0, queryIndex);
  hashString = hashString.substring(queryIndex + 1);
  const hashObject: Record<string, string> = {};
  hashString
    .split("&")
    .filter((s) => s.length > 0)
    .map((s) => {
      const dividerIndex = s.indexOf("=");
      if (dividerIndex === -1) {
        return [s, ""];
      }
      const key = s.substring(0, dividerIndex);
      const value = s.substring(dividerIndex + 1);
      return [key, value];
    })
    .forEach(([key, value]) => {
      hashObject[key] = value;
    });

  Object.keys(hashObject).forEach((key) => {
    hashObject[key] = hashObject[key];
  });
  return [preHashString, hashObject];
};

export const getHashParamValue = (
  url: string | URL,
  key: string
): string | undefined => {
  const [_, hashParams] = getUrlHashParams(url);
  return hashParams[key];
};

export const getHashParamFromWindow = (key: string): string | undefined => {
  return getHashParamsFromWindow()[1][key];
};

export const getHashParamsFromWindow = (): [string, Record<string, string>] => {
  return getUrlHashParams(window.location.href);
};

export const setHashParamInWindow = (
  key: string,
  value: string | undefined,
  opts?: SetHashParamOpts
) => {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.substring(1)
    : window.location.hash;
  const newHash = setHashParamValueInHashString(hash, key, value);
  if (newHash === hash) {
    return;
  }

  if (opts?.modifyHistory) {
    // adds to browser history, so affects back button
    // fires "hashchange" event
    window.location.hash = newHash;
  } else {
    // The following will NOT work to trigger a 'hashchange' event:
    // Replace the state so the back button works correctly
    window.history.replaceState(
      null,
      document.title,
      `${window.location.pathname}${window.location.search}${
        newHash.startsWith("#") ? "" : "#"
      }${newHash}`
    );
    // Manually trigger a hashchange event:
    // I don't know how to add the previous and new url parameters
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
};

// returns hash string
export const setHashParamValueInHashString = (
  hash: string,
  key: string,
  value: string | undefined
): string => {
  const [preHashParamString, hashObject] = getUrlHashParamsFromHashString(hash);

  let changed = false;
  if (
    (hashObject.hasOwnProperty(key) && value === null) ||
    value === undefined
  ) {
    delete hashObject[key];
    changed = true;
  } else {
    if (hashObject[key] !== value) {
      hashObject[key] = value;
      changed = true;
    }
  }

  // don't do work if unneeded
  if (!changed) {
    return hash;
  }

  const keys = Object.keys(hashObject);
  keys.sort();
  const hashStringNew = keys
    .map((key, i) => {
      const value = hashObject[key];

      // Check if value is already base64-encoded (contains only base64 chars and has proper length)
      // This is a simple check to avoid URL-encoding base64 strings
      const isBase64 =
        /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;

      // Only URL-encode if it's not already base64-encoded
      return `${key}=${value}`;
    })
    .join("&");

  // replace after the ? but keep before that
  if (!preHashParamString && !hashStringNew) {
    return "";
  }

  return `${preHashParamString || ""}${
    hashStringNew ? "?" + hashStringNew : ""
  }`;
};

/**
 * Efficiently creates a hash string with multiple parameters at once.
 * This is more efficient than calling setHashParamValueInHashString repeatedly.
 */
export const createHashParamValuesInHashString = (
  hash: string,
  params: Record<string, string | undefined>
): string => {
  // Efficiently extract prehash string and existing parameters
  let hashString = hash;
  while (hashString.startsWith("#")) {
    hashString = hashString.substring(1);
  }

  const queryIndex = hashString.indexOf("?");
  const preHashString =
    queryIndex === -1 ? hashString : hashString.substring(0, queryIndex);

  // Parse existing parameters efficiently
  const hashObject: Record<string, string> = {};
  if (queryIndex !== -1) {
    const paramsString = hashString.substring(queryIndex + 1);
    if (paramsString.length > 0) {
      paramsString.split("&").forEach((s) => {
        if (s.length > 0) {
          const dividerIndex = s.indexOf("=");
          if (dividerIndex === -1) {
            hashObject[s] = "";
          } else {
            const key = s.substring(0, dividerIndex);
            const value = s.substring(dividerIndex + 1);
            hashObject[key] = value;
          }
        }
      });
    }
  }

  // Apply new parameters
  let changed = false;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      if (hashObject.hasOwnProperty(key)) {
        delete hashObject[key];
        changed = true;
      }
    } else if (hashObject[key] !== value) {
      hashObject[key] = value;
      changed = true;
    }
  }

  // don't do work if unneeded
  if (!changed) {
    return hash;
  }

  // Build the new hash string efficiently
  const keys = Object.keys(hashObject);
  keys.sort();
  const hashStringNew = keys
    .map((key) => {
      const value = hashObject[key];
      // Check if value is already base64-encoded (contains only base64 chars and has proper length)
      const isBase64 =
        /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
      // Only URL-encode if it's not already base64-encoded
      return `${key}=${value}`;
    })
    .join("&");

  // Construct final hash string
  if (!preHashString && !hashStringNew) {
    return "";
  }

  return `${preHashString || ""}${hashStringNew ? "?" + hashStringNew : ""}`;
};

// returns URL string
export const setHashParamValueInUrl = (
  url: string | URL,
  key: string,
  value: string | undefined
): URL => {
  const urlBlob = url instanceof URL ? url : new URL(url);
  const newHash = setHashParamValueInHashString(urlBlob.hash, key, value);
  urlBlob.hash = newHash;
  return urlBlob;
};

/**
 * Convenience function to set multiple hash parameters in a URL at once.
 * Takes a URL (string or URL object) and a record of hash parameters,
 * then returns a URL with those parameters set.
 */
export const setHashParamsInUrl = (
  url: string | URL,
  params: Record<string, string | undefined>
): URL => {
  const urlBlob = url instanceof URL ? url : new URL(url);
  let newHash = createHashParamValuesInHashString(urlBlob.hash, params);
  urlBlob.hash = newHash;
  return urlBlob;
};

/* json */

export const setHashParamValueJsonInUrl = <T>(
  url: string | URL,
  key: string,
  value: T | undefined
): URL => {
  const urlBlob = url instanceof URL ? url : new URL(url);
  urlBlob.hash = setHashParamValueJsonInHashString(urlBlob.hash, key, value);
  return urlBlob;
};

export const getHashParamValueJsonFromUrl = <T>(
  url: string | URL,
  key: string
): T | undefined => {
  const valueString = getHashParamValue(url, key);
  if (valueString && valueString !== "") {
    const value = blobFromBase64String(valueString);
    return value;
  }
  return;
};

export const getHashParamValueJsonFromHashString = <T>(
  hash: string,
  key: string
): T | undefined => {
  const [_, hashParams] = getUrlHashParamsFromHashString(hash);
  const valueString = hashParams[key];
  if (valueString && valueString !== "") {
    const value = blobFromBase64String(valueString);
    return value;
  }
  return;
};

export const setHashParamValueJsonInWindow = <T>(
  key: string,
  value: T | undefined,
  opts?: SetHashParamOpts
): void => {
  const valueString = value ? blobToBase64String(value) : undefined;
  setHashParamInWindow(key, valueString, opts);
};

export const getHashParamValueJsonFromWindow = <T>(
  key: string
): T | undefined => {
  return getHashParamValueJsonFromUrl(window.location.href, key);
};

export const setHashParamValueJsonInHashString = <T>(
  hash: string,
  key: string,
  value: T | undefined
) => {
  const valueString = value ? blobToBase64String(value) : undefined;
  return setHashParamValueInHashString(hash, key, valueString);
};

/* float */

export const setHashParamValueFloatInUrl = (
  url: string,
  key: string,
  value: number | undefined
): URL => {
  return setHashParamValueInUrl(url, key, value ? value.toString() : undefined);
};

export const getHashParamValueFloatFromUrl = (
  url: string | URL,
  key: string
): number | undefined => {
  const hashParamString = getHashParamValue(url, key);
  return hashParamString ? parseFloat(hashParamString) : undefined;
};

export const setHashParamValueFloatInWindow = (
  key: string,
  value: number | undefined,
  opts?: SetHashParamOpts
): void => {
  setHashParamInWindow(
    key,
    value !== undefined && value !== null ? value.toString() : undefined,
    opts
  );
};

export const getHashParamValueFloatFromWindow = (
  key: string
): number | undefined => {
  return getHashParamValueFloatFromUrl(window.location.href, key);
};

/* integer */

export const setHashParamValueIntInUrl = (
  url: string,
  key: string,
  value: number | undefined
): URL => {
  return setHashParamValueInUrl(
    url,
    key,
    value !== undefined && value !== null ? value.toString() : undefined
  );
};

export const getHashParamValueIntFromUrl = (
  url: string | URL,
  key: string
): number | undefined => {
  const hashParamString = getHashParamValue(url, key);
  return hashParamString ? parseInt(hashParamString) : undefined;
};

export const setHashParamValueIntInWindow = (
  key: string,
  value: number | undefined,
  opts?: SetHashParamOpts
): void => {
  setHashParamValueFloatInWindow(key, value, opts);
};

export const getHashParamValueIntFromWindow = (
  key: string
): number | undefined => {
  return getHashParamValueIntFromUrl(window.location.href, key);
};

/* boolean */

export const setHashParamValueBooleanInUrl = (
  url: string,
  key: string,
  value: boolean | undefined
): URL => {
  return setHashParamValueInUrl(url, key, value ? "true" : undefined);
};

export const getHashParamValueBooleanFromUrl = (
  url: string | URL,
  key: string
): boolean | undefined => {
  const hashParamString = getHashParamValue(url, key);
  return hashParamString === "true" ? true : false;
};

export const setHashParamValueBooleanInWindow = (
  key: string,
  value: boolean | undefined,
  opts?: SetHashParamOpts
): void => {
  setHashParamInWindow(key, value ? "true" : undefined, opts);
};

export const getHashParamValueBooleanFromWindow = (
  key: string
): boolean | undefined => {
  return getHashParamValueBooleanFromUrl(window.location.href, key);
};

/* HashValueBase64 */

export const setHashParamValueBase64EncodedInUrl = (
  url: string,
  key: string,
  value: string | undefined
): URL => {
  return setHashParamValueInUrl(
    url,
    key,
    value === null || value === undefined
      ? undefined
      : stringToBase64String(value)
  );
};

export const getHashParamValueBase64DecodedFromUrl = (
  url: string | URL,
  key: string
): string | undefined => {
  const valueString = getHashParamValue(url, key);
  return valueString && valueString !== ""
    ? stringFromBase64String(valueString)
    : undefined;
};

export const setHashParamValueBase64EncodedInWindow = (
  key: string,
  value: string | undefined,
  opts?: SetHashParamOpts
): void => {
  const encodedValue =
    value === null || value === undefined
      ? undefined
      : stringToBase64String(value);
  setHashParamInWindow(key, encodedValue, opts);
};

export const getHashParamValueBase64DecodedFromWindow = (
  key: string
): string | undefined => {
  return getHashParamValueBase64DecodedFromUrl(window.location.href, key);
};

/* HashValueUriEncoded */

export const setHashParamValueUriEncodedInUrl = (
  url: string,
  key: string,
  value: string | undefined
): URL => {
  return setHashParamValueInUrl(
    url,
    key,
    value === null || value === undefined
      ? undefined
      : encodeURIComponent(value)
  );
};

export const getHashParamValueUriDecodedFromUrl = (
  url: string | URL,
  key: string
): string | undefined => {
  const valueString = getHashParamValue(url, key);
  return valueString && valueString !== ""
    ? decodeURIComponent(valueString)
    : undefined;
};

export const setHashParamValueUriEncodedInWindow = (
  key: string,
  value: string | undefined,
  opts?: SetHashParamOpts
): void => {
  const encodedValue =
    value === null || value === undefined
      ? undefined
      : encodeURIComponent(value);
  setHashParamInWindow(key, encodedValue, opts);
};

export const getHashParamValueUriDecodedFromWindow = (
  key: string
): string | undefined => {
  return getHashParamValueUriDecodedFromUrl(window.location.href, key);
};

export const deleteHashParamFromWindow = (
  key: string,
  opts?: SetHashParamOpts
): void => {
  setHashParamInWindow(key, undefined, opts);
};

export const deleteHashParamFromUrl = (url: string | URL, key: string): URL => {
  return setHashParamValueInUrl(url, key, undefined);
};

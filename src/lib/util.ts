/**
 * Core logic for getting/setting hash params
 * Important note: the internal hash string does NOT have the leading #
 */

import stringify from 'fast-json-stable-stringify';

export type SetHashParamOpts = {
  modifyHistory?: boolean;
};

export const isIframe = (): boolean => {
  //http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  try {
    return window !== window.top;
  } catch (ignored) {
    return false;
  }
};

export const blobToBase64String = (blob: Record<string, any>) => {
  return btoa(encodeURIComponent(stringify(blob)));
};

export const blobFromBase64String = (value: string | undefined) => {
  if (value && value.length > 0) {
    const blob = JSON.parse(decodeURIComponent(atob(value)));
    return blob;
  }
  return undefined;
};

// Get everything after # then after ?
export const getUrlHashParams = (
  url: string
): [string, Record<string, string>] => {
  const urlBlob = new URL(url);
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
    try {
      hashObject[key] = decodeURI(hashObject[key]);
    } catch (ignored) {
      hashObject[key] = hashObject[key];
    }
  });
  return [preHashString, hashObject];
};

export const getHashParamValue = (
  url: string,
  key: string
): string | undefined => {
  const [_, hashParams] = getUrlHashParams(url);
  return hashParams[key];
};

export const getHashParamValueJson = <T>(
  url: string,
  key: string
): T | undefined => {
  const valueString = getHashParamValue(url, key);
  if (valueString && valueString !== "") {
    const value = blobFromBase64String(valueString);
    return value;
  }
  return;
};

export const getHashParamFromWindow = (key: string): string | undefined => {
  return getHashParamsFromWindow()[1][key];
};

export const getHashParamsFromWindow = (): [string, Record<string, string>] => {
  return getUrlHashParams(window.location.href);
};

export const getHashParamValueDecodedBase64FromWindow = (
  key: string
): string | undefined => {
  return getHashParamValueDecodedBase64(window.location.href, key);
};

export const getHashParamValueJsonFromWindow = <T>(
  key: string
): T | undefined => {
  return getHashParamValueJson(window.location.href, key);
};

export const getHashParamValueDecodedBase64 = (
  url: string,
  key: string
): string | undefined => {
  const valueString = getHashParamValue(url, key);
  if (valueString && valueString !== "") {
    const value = atob(valueString);
    return value;
  }
  return;
};

export const setHashParamInWindow = (
  key: string,
  value: string | undefined,
  opts?: SetHashParamOpts
) => {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.substring(1)
    : window.location.hash;
  const newHash = setHashValueInHashString(hash, key, value);
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

export const setHashParamJsonInWindow = <T>(
  key: string,
  value: T | undefined,
  opts?: SetHashParamOpts
) => {
  const valueString = value ? blobToBase64String(value) : undefined;
  setHashParamInWindow(key, valueString, opts);
};

// returns hash string
export const setHashValueInHashString = (
  hash: string,
  key: string,
  value: string | undefined
) => {
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
      return `${key}=${encodeURI(hashObject[key])}`;
    })
    .join("&");
  // replace after the ? but keep before that
  return `${preHashParamString}?${hashStringNew}`;
};

export const setHashValueJsonInHashString = <T>(
  hash: string,
  key: string,
  value: T | undefined
) => {
  const valueString = value ? blobToBase64String(value) : undefined;
  return setHashValueInHashString(hash, key, valueString);
};

// returns URL string
export const setHashValueInUrl = (
  url: string,
  key: string,
  value: string | undefined
) => {
  const urlBlob = new URL(url);
  const newHash = setHashValueInHashString(urlBlob.hash, key, value);
  urlBlob.hash = newHash;
  return urlBlob.href;
};

// returns URL string
export const setHashValueJsonInUrl = <T>(
  url: string,
  key: string,
  value: T | undefined
) => {
  const urlBlob = new URL(url);
  urlBlob.hash = setHashValueJsonInHashString(urlBlob.hash, key, value);
  return urlBlob.href;
};

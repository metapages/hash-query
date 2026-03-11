
# @metapages/hash-query

Get/set URL parameters (state) in the hash string instead of the query string.

Keep state in sync in the URL

- Includes react hooks for getting/setting typed values.
- Includes low level tools for getting/setting arbitrary typed values.
  - Includes base64 encoding/decoding of JSON objects, booleans, numbers, etc.

## Usage

Install the package:
```sh
npm i @metapages/hash-query
```

Use the hook in your component:

```typescript
import { useHashParamJson } from "@metapages/hash-query/react-hooks";

...

const [jsonBlob, setJsonBlob] = useHashParamJson<Thing>("key", defaultValue);
```


Use the low level tools for getting/setting arbitrary typed values:

```typescript
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueJsonInWindow,
} from "@metapages/hash-query";

const jsonBlob = getHashParamValueJsonFromWindow<Thing>("key");
setHashParamValueJsonInWindow("key", jsonBlob);
```

Use plain JavaScript hash param listeners (non-React):

```typescript
import {
  addEventListenerHashParamJson,
  setHashParamValueJsonInWindow,
} from "@metapages/hash-query";

const dispose = addEventListenerHashParamJson<Thing>("key", (value) => {
  // Fires once after a tick with current value, then on each hashchange.
  console.log("hash param changed:", value);
});

setHashParamValueJsonInWindow("key", { foo: "bar" });

// Later: remove listener
dispose();
```

## How it works


The hash part of the URL (everything after `#`) is split into the `<hash value>` part and the `key=val` query parts of the hash parameter:

```
https://<origin><path><?querystring>#<hash value>?hashkey1=hashvaue1&hashkey2=hashvaue2...
```


## Examples

### Other types:

```typescript

import {
useHashParam,
useHashParamBase64,
useHashParamBoolean,
useHashParamFloat,
useHashParamInt,
useHashParamJson,
useHashParamUriEncoded,
} from "@metapages/hash-query/react-hooks";

```

Usage is the same as the JSON example above (get/set value)

### Plain JavaScript listeners (typed):

```typescript
import {
  addEventListenerHashParamBase64,
  addEventListenerHashParamBoolean,
  addEventListenerHashParamFloat,
  addEventListenerHashParamInt,
  addEventListenerHashParamJson,
  addEventListenerHashParamUriEncoded,
} from "@metapages/hash-query";

const cleanupBase64 = addEventListenerHashParamBase64("name", (value) => {
  // value: string | undefined (decoded from base64)
});
const cleanupBoolean = addEventListenerHashParamBoolean("enabled", (value) => {
  // value: boolean | undefined
});
const cleanupFloat = addEventListenerHashParamFloat("ratio", (value) => {
  // value: number | undefined
});
const cleanupInt = addEventListenerHashParamInt("count", (value) => {
  // value: number | undefined
});
const cleanupJson = addEventListenerHashParamJson<{ foo: string }>(
  "blob",
  (value) => {
    // value: { foo: string } | undefined
  }
);
const cleanupUri = addEventListenerHashParamUriEncoded("q", (value) => {
  // value: string | undefined (decoded from URI encoding)
});

// Each listener fires once after a tick with current value, then on hashchange.
cleanupBase64();
cleanupBoolean();
cleanupFloat();
cleanupInt();
cleanupJson();
cleanupUri();
```

### Setting multiple hash parameters at once:

```typescript
import { setHashParamsInUrl } from "@metapages/hash-query";

const url = "https://example.com/page#section";
const params = {
  theme: "dark",
  language: "en",
  view: "grid",
  filter: undefined, // This will be ignored/removed
};

const newUrl = setHashParamsInUrl(url, params);
// Result: "https://example.com/page#section?theme=dark&language=en&view=grid"
```

## API and utils for direct manipulation

Low level tools and utils for getting/setting arbitrary typed values in the URL hash string or manipulating the hash string without having to actually set the URL:


## Exported functions

```sh
# Base Functions
blobToBase64String
blobFromBase64String
stringToBase64String
stringFromBase64String
getUrlHashParams
getUrlHashParamsFromHashString
getHashParamValue
getHashParamFromWindow
getHashParamsFromWindow
setHashParamInWindow
setHashParamValueInHashString
setHashParamValueInUrl
deleteHashParamFromWindow
deleteHashParamFromUrl
# JSON Functions
setHashParamValueJsonInUrl
getHashParamValueJsonFromUrl
setHashParamValueJsonInWindow
getHashParamValueJsonFromWindow
setHashParamValueJsonInHashString
# Float Functions
setHashParamValueFloatInUrl
getHashParamValueFloatFromUrl
setHashParamValueFloatInWindow
getHashParamValueFloatFromWindow
# Integer Functions
setHashParamValueIntInUrl
getHashParamValueIntFromUrl
setHashParamValueIntInWindow
getHashParamValueIntFromWindow
# Boolean Functions
setHashParamValueBooleanInUrl
getHashParamValueBooleanFromUrl
setHashParamValueBooleanInWindow
getHashParamValueBooleanFromWindow
# Base64 Functions
setHashParamValueBase64EncodedInUrl
getHashParamValueBase64DecodedFromUrl
setHashParamValueBase64EncodedInWindow
getHashParamValueBase64DecodedFromWindow
# UriEncoded Functions
setHashParamValueUriEncodedInUrl
getHashParamValueUriDecodedFromUrl
setHashParamValueUriEncodedInWindow
getHashParamValueUriDecodedFromWindow
# Listener Functions
addEventListenerHashParamBase64
addEventListenerHashParamBoolean
addEventListenerHashParamFloat
addEventListenerHashParamInt
addEventListenerHashParamJson
addEventListenerHashParamUriEncoded
```

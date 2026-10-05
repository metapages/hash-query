# @metapages/hash-query

**Store application state in the URL hash.** Typed get/set of hash query
parameters (JSON, base64, boolean, int, float, string), plus React hooks.
The URL becomes the state: shareable, bookmarkable, back/forward-friendly,
and it never touches a server or a database.

```
https://example.com/app#?theme=dark&view=grid&config=eyJmb28iOiJiYXIifQ%3D%3D
                        └──────────── your app state lives here ────────────┘
```

```sh
npm i @metapages/hash-query
```

[npm](https://www.npmjs.com/package/@metapages/hash-query) ·
[GitHub](https://github.com/metapages/hash-query) · MIT · TypeScript ·
zero runtime dependencies beyond `fast-json-stable-stringify`

---

## What problem does this solve?

You want a user's settings, filters, editor contents, or app configuration to
survive a page reload and be shareable as a plain link — without a backend,
without a login, without `localStorage` (which is per-browser and unshareable).

Putting that state in the URL **hash fragment** (everything after `#`) means:

- **Nothing is sent to the server.** Browsers never transmit the fragment in an
  HTTP request. Your state stays out of server logs, CDN logs, and analytics
  referrers. This is the main reason to prefer the hash over `?query=params`.
- **Works on any static host.** GitHub Pages, S3, a CDN — no routing config, no
  server-side rendering of query params, no server at all.
- **Copy the URL, and you copy the state.** Paste it in Slack, bookmark it, put
  it in a QR code. The recipient sees exactly what you saw.
- **Safe inside iframes and embeds.** Each embedded app owns its own hash state.

This library is the URL-state layer behind [framejs.io](https://framejs.io) and
[metapage.io](https://metapage.io), where entire runnable apps and their inputs
are encoded into a single shareable link.

## Quick start

### Plain JavaScript / TypeScript (no framework)

```typescript
import {
  getHashParamValueJsonFromWindow,
  setHashParamValueJsonInWindow,
} from "@metapages/hash-query";

type Settings = { theme: string; count: number };

// Read state from the URL
const settings = getHashParamValueJsonFromWindow<Settings>("settings");

// Write state to the URL (updates the address bar immediately)
setHashParamValueJsonInWindow("settings", { theme: "dark", count: 3 });
```

### React

```typescript
import { useHashParamJson } from "@metapages/hash-query/react-hooks";

const Component = () => {
  const [settings, setSettings] = useHashParamJson<Settings>("settings", {
    theme: "light",
    count: 0,
  });

  return (
    <button onClick={() => setSettings({ ...settings, count: settings.count + 1 })}>
      {settings.count}
    </button>
  );
};
```

### Browser via CDN (no build step)

```html
<script type="module">
  import {
    getHashParamValueJsonFromWindow,
    setHashParamValueJsonInWindow,
  } from "https://cdn.jsdelivr.net/npm/@metapages/hash-query/+esm";

  setHashParamValueJsonInWindow("state", { hello: "world" });
</script>
```

### Reacting to changes without React

```typescript
import { addEventListenerHashParamJson } from "@metapages/hash-query";

const dispose = addEventListenerHashParamJson<Settings>("settings", (value) => {
  // Fires once on the next tick with the current value, then on every change.
  render(value);
});

dispose(); // remove the listener
```

## How the URL is structured

The hash is split into a **pre-hash value** and a **hash query string**:

```
https://<origin><path><?querystring>#<hash value>?hashkey1=hashvalue1&hashkey2=hashvalue2
                                     └─ preserved ┘└──── managed by this library ────┘
```

The part before the `?` is left untouched, so this coexists with anchor links
(`#section`) and hash-based routers (`#/route?key=value`).

Keys are always sorted when written, so the same state always produces the same
URL string — URLs stay diffable, cacheable, and comparable. JSON values are
serialized with `fast-json-stable-stringify` for the same reason.

## Behaviour details

| Behaviour | Default |
| --- | --- |
| History entries | Writes use `history.replaceState` — the back button is **not** polluted by every keystroke. Pass `{ modifyHistory: true }` to push a real history entry. |
| Change notification | A `hashchange` event is always dispatched, including for `replaceState` writes, so hooks and listeners stay in sync. |
| SSR / Node | Every `*FromWindow` / `*InWindow` function is guarded — reads return `undefined`, writes are no-ops. Nothing throws when `window` is absent. |
| Removing a value | Set it to `undefined` — the key is deleted from the URL. |
| React dependency | Optional. The core entry point has no React import; only `@metapages/hash-query/react-hooks` needs it. |

## Which URL-state library should I use?

| Use case | Reach for |
| --- | --- |
| State must **not** reach the server; static site, iframe, or embeddable app; plain JS as well as React | **`@metapages/hash-query`** (this package) |
| Next.js / React app where state belongs in the **query string** and the server should see it (SSR, sharing to link unfurlers, SEO) | [`nuqs`](https://www.npmjs.com/package/nuqs) |
| React app wanting query-string state with custom serializers, integrated with React Router | [`use-query-params`](https://www.npmjs.com/package/use-query-params) |
| Just parsing/stringifying a query string, no state binding, no DOM | [`query-string`](https://www.npmjs.com/package/query-string) |
| A single minimal React hook for one string in the fragment | [`use-hash-param`](https://www.npmjs.com/package/use-hash-param) |

The essential distinction: **query string (`?`) is visible to the server; hash
fragment (`#`) is not.** If your state is large, private, or your app is served
as static files, the hash is the right place, and that is what this library is
built for.

## FAQ

### How do I store state in the URL in JavaScript?

Use `setHashParamValueJsonInWindow(key, value)` to write and
`getHashParamValueJsonFromWindow(key)` to read. Objects are JSON-serialized and
base64-encoded so they survive URL round-trips intact.

### How do I persist React state in the URL?

Use the hooks from `@metapages/hash-query/react-hooks`. They have the same shape
as `useState`, but the value lives in the URL:

```typescript
const [value, setValue] = useHashParamJson<T>("key", defaultValue);
```

### Should I use the URL hash or the query string?

Use the hash when the state is client-only: the browser never sends it to the
server, so it stays out of logs and works on static hosting. Use the query
string when the server needs to read the state (SSR, redirects, link previews).

### How do I share app state as a link?

Write your state with this library, then hand the user `window.location.href`.
The full state is in that string; anyone opening it gets the same view.

### Can I store an object in the URL?

Yes — `useHashParamJson` / `getHashParamValueJsonFromWindow` handle arbitrary
JSON. Values are base64-encoded, so nested objects, arrays, and strings with
special characters are safe. Browsers accept very long URLs (Chrome ~2MB), but
keep them small enough to paste comfortably.

### Does this work without React?

Yes. The core entry point is framework-agnostic plain TypeScript. React hooks
are an optional separate entry point (`/react-hooks`).

### Does this work with Next.js / SSR?

Reads and writes are no-ops when `window` is undefined, so it will not crash
during server rendering. Because the server never sees the hash, hydrate from it
in an effect on the client. If you need server-visible state, use the query
string instead.

### Is this an alternative to localStorage?

Yes, when you want the state to be **shareable**. `localStorage` is bound to one
browser on one device and cannot be sent to anyone. URL hash state travels with
the link.

## API

All functions are exported from `@metapages/hash-query`. Naming is systematic:

- `...FromWindow` / `...InWindow` — read/write `window.location` directly.
- `...FromUrl` / `...InUrl` — operate on a URL string or `URL` object, returning
  a new URL. Nothing is mutated in the browser.
- `...InHashString` / `...FromHashString` — operate on a bare hash string, for
  full manual control.

**Reading a large value? Use the `FromHashString` getter.** The `FromUrl`
getters call `new URL()`, and Firefox's url parser hard-caps at 1 MiB
(`network.standard-url.max-length`) — past it the constructor *throws*, where
Chrome and Safari parse on. Building a url out of every param just to read one
of them therefore crashes on an oversize *neighbouring* param, in one browser
only. The `FromHashString` getters never construct a URL and have no such limit.

### Core

```
getUrlHashParams(url)                          -> [preHashValue, Record<string,string>]
getUrlHashParamsFromHashString(hash)           -> [preHashValue, Record<string,string>]
getHashParamValue(url, key)                    -> string | undefined
getHashParamValueFromHashString(hash, key)     -> string | undefined
getHashParamFromWindow(key)                    -> string | undefined
getHashParamsFromWindow()                      -> [preHashValue, Record<string,string>]
setHashParamInWindow(key, value, opts?)
setHashParamValueInHashString(hash, key, value)-> string
setHashParamValueInUrl(url, key, value)        -> URL
setHashParamsInUrl(url, params)                -> URL   // set many at once
deleteHashParamFromWindow(key)
deleteHashParamFromUrl(url, key)               -> URL
```

`opts` is `{ modifyHistory?: boolean }` — `true` pushes a browser history entry.

### Typed accessors

Each type has the same set of functions:

| Type | Functions |
| --- | --- |
| JSON | `setHashParamValueJsonInUrl`, `getHashParamValueJsonFromUrl`, `setHashParamValueJsonInWindow`, `getHashParamValueJsonFromWindow`, `setHashParamValueJsonInHashString`, `getHashParamValueJsonFromHashString` |
| Float | `setHashParamValueFloatInUrl`, `getHashParamValueFloatFromUrl`, `setHashParamValueFloatInWindow`, `getHashParamValueFloatFromWindow`, `getHashParamValueFloatFromHashString` |
| Integer | `setHashParamValueIntInUrl`, `getHashParamValueIntFromUrl`, `setHashParamValueIntInWindow`, `getHashParamValueIntFromWindow`, `getHashParamValueIntFromHashString` |
| Boolean | `setHashParamValueBooleanInUrl`, `getHashParamValueBooleanFromUrl`, `setHashParamValueBooleanInWindow`, `getHashParamValueBooleanFromWindow`, `getHashParamValueBooleanFromHashString` |
| Base64 | `setHashParamValueBase64EncodedInUrl`, `getHashParamValueBase64DecodedFromUrl`, `setHashParamValueBase64EncodedInWindow`, `getHashParamValueBase64DecodedFromWindow`, `getHashParamValueBase64DecodedFromHashString` |
| URI-encoded | `setHashParamValueUriEncodedInUrl`, `getHashParamValueUriDecodedFromUrl`, `setHashParamValueUriEncodedInWindow`, `getHashParamValueUriDecodedFromWindow`, `getHashParamValueUriDecodedFromHashString` |

### Encoding helpers

```
blobToBase64String(object)      -> string   // stable-stringify then base64
blobFromBase64String(string)    -> object
stringToBase64String(string)    -> string
stringFromBase64String(string)  -> string
```

### Event listeners (no framework)

Each returns a dispose function. Each fires once on the next tick with the
current value, then on every `hashchange`.

```
addEventListenerHashParamBase64(key, cb)
addEventListenerHashParamBoolean(key, cb)
addEventListenerHashParamFloat(key, cb)
addEventListenerHashParamInt(key, cb)
addEventListenerHashParamJson<T>(key, cb)
addEventListenerHashParamUriEncoded(key, cb)
```

### React hooks

From `@metapages/hash-query/react-hooks`. All have the `useState` signature
`[value, setValue]`, and `setValue` accepts the same `opts` argument.

```typescript
import {
  useHashParam,            // string
  useHashParamBase64,      // string, base64-encoded in the URL
  useHashParamBoolean,     // boolean
  useHashParamFloat,       // number
  useHashParamInt,         // number
  useHashParamJson,        // any JSON-serializable value
  useHashParamUriEncoded,  // string, URI-encoded in the URL
} from "@metapages/hash-query/react-hooks";
```

## Recipes

### Set several parameters in one URL update

```typescript
import { setHashParamsInUrl } from "@metapages/hash-query";

const newUrl = setHashParamsInUrl("https://example.com/page#section", {
  theme: "dark",
  language: "en",
  view: "grid",
  filter: undefined, // omitted / removed
});
// https://example.com/page#section?language=en&theme=dark&view=grid
```

### Build a shareable link without navigating

```typescript
import { setHashParamValueJsonInUrl } from "@metapages/hash-query";

const shareUrl = setHashParamValueJsonInUrl(
  window.location.href,
  "config",
  currentConfig
).href;
```

### Add a back-button step

```typescript
setHashParamValueJsonInWindow("page", { index: 2 }, { modifyHistory: true });
```

## Development

This repo uses [`just`](https://github.com/casey/just):

```sh
just          # list commands
just build    # typescript check + vite build into ./dist
just test     # run the test suite
```

## License

MIT

# Share-by-link

Implemented in `src/lib/share.ts`. A run is fully reproducible from its
source + stdin (+ language), so those three fields get packed into a
URL-safe base64 token that rides in the URL hash (`#s=…`).

- **No server, no storage** — everything is client-side. The link *is* the
  data; there's nothing to look up.
- **UTF-8 safe** — handles non-ASCII source via `TextEncoder`/`TextDecoder`
  before base64-encoding, so it isn't limited to Latin-1-safe characters.
- **Backward compatible** — links created before the `language` field existed
  decode with no `l` key, and default to Python.
- **Compact** — Python is treated as the default language, so only
  non-Python (`javascript`) needs to spend a byte on the `l` field.

## Format

`encodeShare`/`decodeShare` pack/unpack a small object:
```ts
{ c: string;        // code
  i?: string;       // stdin, only present if non-empty
  l?: "javascript"; // only present when not Python
}
```
This is then JSON-stringified, UTF-8 encoded, and base64url-encoded (`+`/`/`
swapped for `-`/`_`, no padding) — safe to embed directly in a URL fragment.

Decoding is defensive: any parse failure or malformed payload returns `null`
rather than throwing, so a corrupted link degrades to "start fresh" instead
of crashing the app.

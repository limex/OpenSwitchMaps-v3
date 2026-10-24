# Map round-trip regression tests

Requires Node 22.12+ and installed project dependencies.

Origin: `https://bikerouter.de/#map=13/46.6478/12.1939/standard,mapterhorn-hillshading&profile=hiking-beta`

Every route must preserve latitude **46.6478**, longitude **12.1939**, and zoom **13**:

- Bikerouter → Google Maps → Bikerouter
- Bikerouter → CamperMap → Bikerouter
- Bikerouter → Google Maps → CamperMap → Bikerouter

Komoot Discover is excluded by request. Tests compare numeric coordinates, allowing equivalent trailing zeroes. Bikerouter's layer and routing profile are not asserted: the existing generator substitutes its own defaults.

## Deterministic source tests

Run `npm test`. This compiles `src/maps.js` to a temporary directory using Parcel, then exercises the real URL generators and parsers. It checks exact outbound URLs and the final coordinates. It does not update `dist`, bump the version, or deploy anything. Only the unused startup Chrome tab query is stubbed.

## Live browser tests

1. Run `npm run build` when extension source has changed. This project's build also increments its version and runs its configured deployment copy.
2. Load the repository's `dist` directory as an unpacked extension in a dedicated Chrome profile with remote debugging enabled. Reload the extension after rebuilding.
3. Enable Google Maps, CamperMap, and Bikerouter in extension options. Open the extension once so its background worker is running.
4. Run `EXTENSION_ID=<installed-extension-id> npm run test:browser`.

The default endpoint is `http://127.0.0.1:9227`; override with `CDP_URL`. Set `RESULTS_FILE` to save a JSON report. The runner uses Chrome's DevTools Protocol directly because the connected DevTools tool disallows extension URLs. Chrome must support [`Extensions.triggerAction`](https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-triggerAction), which invokes the toolbar action with normal tab access; merely calling `chrome.action.openPopup()` is insufficient for these navigation tests.

Each case opens its own temporary Bikerouter tab, opens the actual extension popup, and middle-clicks each requested destination (the extension's current-tab action). It waits for pages to load and normalize their URLs, then independently checks coordinates after every hop. Temporary tabs are closed afterward; existing user tabs are left intact. Left-click/new-tab behavior is not covered.

These tests access live services. Consent, login, network failures, or changed provider URLs cause a failure rather than a false pass. Inspect the reported URL/error before attributing a failure to extension code.

## Baseline before performance changes — 2026-10-24

Extension build 1.8.12, dedicated Chrome Beta profile:

- `npm test`: 4/4 passed (origin parsing and all three routes).
- Live popup tests: 3/3 routes passed using real middle-click navigation.
- Every destination and final Bikerouter URL retained latitude 46.6478, longitude 12.1939, zoom 13. CamperMap normalized coordinates to six decimal places without changing their values.

## Dependency reduction verification — 2026-10-24

Build 1.8.15 replaces Lodash helpers with native JavaScript and separates the
metadata catalog from URL conversion. Minified JavaScript sizes, excluding source maps:

| Bundle | Before (bytes) | After (bytes) | Reduction |
| --- | ---: | ---: | ---: |
| Popup | 739,639 | 316,642 | 57.2% |
| Options | 739,359 | 97,369 | 86.8% |
| Background | 656,621 | 233,716 | 64.4% |

Source maps confirm zero Lodash modules in all three bundles and zero `proj4`
modules in Options. These are bundle-size measurements, not startup timing claims.

- `npm test`: 5/5 passed, including metadata/order consistency.
- Live Chrome Beta popup round trips: 3/3 passed at the original coordinates and zoom.
- Options rendered 111 checkboxes. Toggling CamperMap persisted and updated the
  popup; its original setting was restored.
- Popup content width and scroll width both measured 785 px; its list bottom and
  document height both measured 804 px, confirming no extra scrollable blank area.
- A before/after comparison of all 111 map definitions preserved metadata and
  generated URL/parser results for the origin coordinates, including existing limitations.

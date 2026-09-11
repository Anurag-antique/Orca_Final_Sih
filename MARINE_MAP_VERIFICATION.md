# Marine Map verification — 10 September 2026

## Current PFZ source

The Marine Map now reads the official INCOIS WebGIS WFS endpoint discovered from the WebGIS source code:

`https://www.incois.gov.in/geoserver/PFZ_Automation/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=PFZ_Automation:pfzlines&outputFormat=application/json`

This returned 55 current `MultiLineString` features on 10 September 2026. Mumbai Coast filtering returned 13 features. The response includes `Year`, `Julian_day`, `Sno`, `UID`, `State_Name`, `Category`, and `Length`; the backend rejects the response when its advisory day does not equal the current UTC day. These are the source's actual line geometries, rendered with React-Leaflet `GeoJSON`; no rectangles or replacement coordinates are created. The PFZ toggle and metadata popup are preserved. The official WebGIS remains linked in the UI: https://www.incois.gov.in/MarineFisheries/PfzWebGis

Run locally with `npm run dev:marine`, then open the Vite URL at `/map`. The running preview for this session is http://127.0.0.1:5174/map. This command uses the existing public API routes on loopback port 5001; it does not require Supabase. The normal full-app command remains unchanged and still requires its database credentials. Port 5000 is occupied by macOS AirPlay on this machine.

The existing ignored `frontend/.env` supplies `VITE_CARTO_API_KEY`. Its value was not printed or copied into source files. New installations can put this browser-visible basemap key in ignored `frontend/.env.local`; without it OSM works automatically. CARTO's documented parameter is `key`: https://carto.com/basemaps/apikey/.

| Criterion | Result and evidence |
| --- | --- |
| 1. Real tiles + fallback | CARTO coastline/ocean visually verified without watermark using the existing key. Real OSM tiles visually verified in a separate key-free preview. The production tile-error handler was exercised by the runnable frontend check and switches to a key-free OSM URL. An actual CARTO provider outage was not induced. |
| 2. Five GIS layers | All five collections render from `/api/map/layers`: PFZ, protected, restricted, hazards, IMBL. Fill/stroke colors and opacity match the legend. Geofence database geometry is included in the API so displayed simulation boundaries match the evaluated zones. Static demo provenance remains visible. |
| 3. Independent toggles | Browser checks observed 17 shapes with all enabled. Turning off PFZ/MPA/naval/hazards/IMBL independently reduced counts to 14/12/13/14/15; restoring each returned to 17. |
| 4. Popups | Zone popup visually verified with Malvan name, type, description, buffer and demo metadata. All five collections share the same safe text-node metadata renderer, including point geometry support. Simulated vessel has its own status/coordinate popup. |
| 5. Simulations | Browser sequence returned MPA CRITICAL_BREACH (inside, 0 km), naval PROXIMITY_WARNING (3.16 km), IMBL BORDER_BUFFER_WARNING (10.27 km), then CLEAR_SAFE. Marker moved and corresponding API geometry received a thicker boundary. Normal Sea removed prior highlights and popups. |
| 6. Weather safety | Offshore click fetched actual weather/ocean and submitted their data to `/risk/evaluate`. Example: 14.1 km/h, 1.18 m, LOW. Vessel selector recalculates using existing engine type keys; API regression verifies differing canoe/deep-sea scores and all four risk levels. Weather uses dotted blue/purple circles, separate from GIS colors. |
| 7. Fallback visibility | Inland click produced live weather plus ocean fallback; both the ocean label and combined risk badge visibly stated mock fallback. Regression checks force outages and missing measurements for both providers. |
| 8. Full run | Reload → all toggles → four simulations → weather click completed with no captured browser console errors. Also checked vessel recalculation and sector reset of prior readings/markers. Production build passed. |

Checks: `node frontend/test_marine_map.cjs`, `node backend/test_marine_map.js`, `npm run build:frontend`.

Necessary shared fixes: the cyclone rule previously matched `NO_CYCLONE_THREAT` as an active cyclone; it now respects explicit inactive status. Real weather/ocean providers now route missing wind/wave measurements through the existing fallback instead of inventing apparently live readings. Zero coordinates are preserved. MarineMap retains existing route overlays and legacy FeatureCollection support. No other page or route-planner/assistant logic was edited; no dependencies added.

Limits: GIS and PFZ are static demo datasets. Weather risk still uses the existing engine and some estimated provider inputs; the page explicitly labels this prototype limitation. CARTO HTTP-success watermark responses from an invalid/revoked key cannot be identified by Leaflet's tile-error event; a valid key is required for CARTO. Build emits the existing large-bundle advisory, not a build failure.

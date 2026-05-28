# FiberGuard HeatMapControl — PCF Component

A Power Apps Component Framework control for Canvas Apps that displays geolocated occurrences on an interactive map, switching between **heat map** (density) and **marker** (pin) modes.

Stack: **Leaflet** + **leaflet.heat** — no API key required.

---

## Properties

### Dataset — `occurrences`

| Property-set | Type | Required | Description |
|---|---|---|---|
| `latitude` | `Decimal` | Yes | Latitude of each occurrence |
| `longitude` | `Decimal` | Yes | Longitude of each occurrence |
| `weight` | `Decimal` | No | Heat intensity for the point (defaults to 1) |
| `label` | `SingleLine.Text` | No | Popup label shown in marker mode |

### Input properties

| Property | Type | Default | Description |
|---|---|---|---|
| `enableHeatmap` | `TwoOptions` | `true` | `true` = heat map mode, `false` = marker mode |
| `heatRadius` | `Whole.None` | `25` | Radius (px) of each point on the heat layer |
| `heatMaxZoom` | `Whole.None` | `17` | Zoom level at which heat intensity is maximum |
| `initialLat` | `Decimal` | `-22.2171` | Initial map center latitude (Marília-SP) |
| `initialLng` | `Decimal` | `-49.9501` | Initial map center longitude |
| `initialZoom` | `Whole.None` | `12` | Initial zoom level |
| `tileUrl` | `SingleLine.Text` | OSM | Tile URL template — empty string uses OpenStreetMap |

---

## Toggling between heat map and markers

Bind a Toggle control in your Canvas App to drive `enableHeatmap`:

```powerfx
// Toggle1.Value controls the mode
HeatMapControl1.enableHeatmap = Toggle1.Value
```

When `Toggle1.Value` is `true` the component renders a heat map layer; when `false` it renders circle markers with optional popups.

---

## Tile URL

Leave `tileUrl` blank to use OpenStreetMap (development/testing). For production, supply a licensed tile provider, for example [MapTiler](https://www.maptiler.com/):

```
https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=YOUR_KEY
```

> **Note:** OSM has a [usage policy](https://operations.osmfoundation.org/policies/tiles/) that restricts heavy production traffic.

---

## Development

```bash
cd HeatMapControl
npm install
npm run build        # production build
npm run start:watch  # harness with hot reload
```

---

## Known risks / out of scope

- **SharePoint delegation (2,000-row limit):** pagination is the Canvas App's responsibility; the PCF handles whatever the dataset delivers.
- **lat/lng precision:** property-sets use `Decimal`; if a data source truncates to integers, adjust `of-type` in `ControlManifest.Input.xml`.
- **Clustering, legends, export:** not implemented — planned for a future phase.

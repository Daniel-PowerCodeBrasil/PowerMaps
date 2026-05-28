import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

interface OccurrencePoint {
  lat: number;
  lng: number;
  weight: number;
  label: string;
}

export class HeatMapControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container: HTMLDivElement;
  private _map: L.Map;
  private _tileLayer: L.TileLayer;
  private _heatLayer: L.HeatLayer | null = null;
  private _markerLayer: L.LayerGroup | null = null;
  private _initialized = false;
  private _lastHeatmapState: boolean | null = null;

  private static readonly DEFAULT_TILE_URL =
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  private static readonly HEAT_GRADIENT: { [key: number]: string } = {
    0.2: "#3B8BD4",
    0.5: "#63D471",
    0.7: "#F2A623",
    1.0: "#E8593C",
  };

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._container.style.width = "100%";
    this._container.style.height = "100%";
    this._container.style.position = "relative";
  }

  updateView(context: ComponentFramework.Context<IInputs>): void {
    const props = context.parameters;

    const width = context.mode.allocatedWidth;
    const height = context.mode.allocatedHeight;

    if (width > 0) this._container.style.width = width + "px";
    if (height > 0) this._container.style.height = height + "px";

    if (!this._initialized) {
      this._initMap(context);
      this._initialized = true;
    } else {
      this._map.invalidateSize();
    }

    const enableHeatmap = props.enableHeatmap.raw ?? true;
    const points = this._readPoints(context);
    this._render(points, enableHeatmap, context);
  }

  private _initMap(context: ComponentFramework.Context<IInputs>): void {
    const props = context.parameters;

    const lat = (props.initialLat.raw as number) ?? -22.2171;
    const lng = (props.initialLng.raw as number) ?? -49.9501;
    const zoom = (props.initialZoom.raw as number) ?? 12;
    const tileUrl =
      (props.tileUrl.raw as string | null) ||
      HeatMapControl.DEFAULT_TILE_URL;

    const mapDiv = document.createElement("div");
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";
    this._container.appendChild(mapDiv);

    this._map = L.map(mapDiv, { center: [lat, lng], zoom });

    this._tileLayer = L.tileLayer(tileUrl, {
      attribution:
        tileUrl === HeatMapControl.DEFAULT_TILE_URL
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          : "",
      maxZoom: 19,
    });
    this._tileLayer.addTo(this._map);

    this._markerLayer = L.layerGroup().addTo(this._map);

    window.addEventListener("resize", () => this._map.invalidateSize());
  }

  private _readPoints(
    context: ComponentFramework.Context<IInputs>
  ): OccurrencePoint[] {
    const dataset = context.parameters.occurrences;
    const points: OccurrencePoint[] = [];

    if (!dataset || !dataset.sortedRecordIds) return points;

    for (const recordId of dataset.sortedRecordIds) {
      const record = dataset.records[recordId];
      if (!record) continue;

      const latRaw = record.getValue("latitude");
      const lngRaw = record.getValue("longitude");

      const lat = Number(latRaw);
      const lng = Number(lngRaw);

      if (isNaN(lat) || isNaN(lng)) continue;

      const weightRaw = record.getValue("weight");
      const weight =
        weightRaw != null && !isNaN(Number(weightRaw)) ? Number(weightRaw) : 1;

      const labelRaw = record.getValue("label");
      const label = labelRaw != null ? String(labelRaw) : "";

      points.push({ lat, lng, weight, label });
    }

    return points;
  }

  private _render(
    points: OccurrencePoint[],
    heatmapOn: boolean,
    context: ComponentFramework.Context<IInputs>
  ): void {
    if (this._lastHeatmapState !== null && this._lastHeatmapState !== heatmapOn) {
      this._clearAllLayers();
    }
    this._lastHeatmapState = heatmapOn;

    if (heatmapOn) {
      this._renderHeatmap(points, context);
    } else {
      this._renderMarkers(points);
    }
  }

  private _clearAllLayers(): void {
    if (this._heatLayer) {
      this._map.removeLayer(this._heatLayer);
      this._heatLayer = null;
    }
    if (this._markerLayer) {
      this._markerLayer.clearLayers();
    }
  }

  private _renderHeatmap(
    points: OccurrencePoint[],
    context: ComponentFramework.Context<IInputs>
  ): void {
    const props = context.parameters;
    const radius = (props.heatRadius.raw as number) ?? 25;
    const maxZoom = (props.heatMaxZoom.raw as number) ?? 17;

    const latlngs: L.HeatLatLngTuple[] = points.map((p) => [
      p.lat,
      p.lng,
      p.weight,
    ]);

    if (this._heatLayer) {
      this._heatLayer.setLatLngs(latlngs);
    } else {
      this._heatLayer = L.heatLayer(latlngs, {
        radius,
        maxZoom,
        blur: 15,
        gradient: HeatMapControl.HEAT_GRADIENT,
      });
      this._heatLayer.addTo(this._map);
    }
  }

  private _renderMarkers(points: OccurrencePoint[]): void {
    if (this._heatLayer) {
      this._map.removeLayer(this._heatLayer);
      this._heatLayer = null;
    }

    if (!this._markerLayer) {
      this._markerLayer = L.layerGroup().addTo(this._map);
    } else {
      this._markerLayer.clearLayers();
    }

    for (const point of points) {
      const marker = L.circleMarker([point.lat, point.lng], {
        color: "#C8185A",
        fillColor: "#C8185A",
        fillOpacity: 0.7,
        radius: 7,
        weight: 1,
      });

      if (point.label) {
        marker.bindPopup(point.label);
      }

      marker.addTo(this._markerLayer);
    }
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    if (this._map) {
      this._map.remove();
    }
  }
}

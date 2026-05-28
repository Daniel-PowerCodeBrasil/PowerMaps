import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as L from "leaflet";
import "leaflet.heat";

interface OccurrencePoint {
  lat: number;
  lng: number;
  weight: number;
  label: string;
}

const STYLE_ID = "pm-heatmap-styles";

const INJECTED_CSS = `
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden}
.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none}
.leaflet-tile::selection{background:transparent}
.leaflet-safari .leaflet-tile{image-rendering:-webkit-optimize-contrast}
.leaflet-safari .leaflet-tile-container{width:1600px;height:1600px;-webkit-transform-origin:0 0}
.leaflet-marker-icon,.leaflet-marker-shadow{display:block}
.leaflet-container .leaflet-overlay-pane svg{max-width:none!important;max-height:none!important}
.leaflet-container .leaflet-marker-pane img,.leaflet-container .leaflet-shadow-pane img,.leaflet-container .leaflet-tile-pane img,.leaflet-container img.leaflet-image-layer,.leaflet-container .leaflet-tile{max-width:none!important;max-height:none!important;width:auto;padding:0}
.leaflet-container img.leaflet-tile{mix-blend-mode:plus-lighter}
.leaflet-container.leaflet-touch-zoom{-ms-touch-action:pan-x pan-y;touch-action:pan-x pan-y}
.leaflet-container.leaflet-touch-drag{-ms-touch-action:pinch-zoom;touch-action:none;touch-action:pinch-zoom}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{-ms-touch-action:none;touch-action:none}
.leaflet-container{-webkit-tap-highlight-color:transparent}
.leaflet-container a{-webkit-tap-highlight-color:rgba(51,181,229,.4)}
.leaflet-tile{filter:inherit;visibility:hidden}
.leaflet-tile-loaded{visibility:inherit}
.leaflet-zoom-box{width:0;height:0;-moz-box-sizing:border-box;box-sizing:border-box;z-index:800}
.leaflet-overlay-pane svg{-moz-user-select:none}
.leaflet-pane{z-index:400}
.leaflet-tile-pane{z-index:200}
.leaflet-overlay-pane{z-index:400}
.leaflet-shadow-pane{z-index:500}
.leaflet-marker-pane{z-index:600}
.leaflet-tooltip-pane{z-index:650}
.leaflet-popup-pane{z-index:700}
.leaflet-map-pane canvas{z-index:100}
.leaflet-map-pane svg{z-index:200}
.leaflet-vml-shape{width:1px;height:1px}
.lvml{display:inline-block;position:absolute}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}
.leaflet-right{right:0}
.leaflet-bottom{bottom:0}
.leaflet-left{left:0}
.leaflet-control{float:left;clear:both}
.leaflet-right .leaflet-control{float:right}
.leaflet-top .leaflet-control{margin-top:10px}
.leaflet-bottom .leaflet-control{margin-bottom:10px}
.leaflet-left .leaflet-control{margin-left:10px}
.leaflet-right .leaflet-control{margin-right:10px}
.leaflet-fade-anim .leaflet-popup{opacity:0;-webkit-transition:opacity .2s linear;-moz-transition:opacity .2s linear;transition:opacity .2s linear}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1}
.leaflet-zoom-animated{-webkit-transform-origin:0 0;-ms-transform-origin:0 0;transform-origin:0 0}
svg.leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-zoom-animated{-webkit-transition:-webkit-transform .25s cubic-bezier(0,0,.25,1);-moz-transition:-moz-transform .25s cubic-bezier(0,0,.25,1);transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-zoom-anim .leaflet-tile,.leaflet-pan-anim .leaflet-tile{-webkit-transition:none;-moz-transition:none;transition:none}
.leaflet-zoom-anim .leaflet-zoom-hide{visibility:hidden}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:-webkit-grab;cursor:-moz-grab;cursor:grab}
.leaflet-crosshair,.leaflet-crosshair .leaflet-interactive{cursor:crosshair}
.leaflet-popup-pane,.leaflet-control{cursor:auto}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,.leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing}
.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-image-layer,.leaflet-pane>svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-image-layer.leaflet-interactive,.leaflet-pane>svg path.leaflet-interactive,svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto}
.leaflet-container{background:#ddd;outline-offset:1px}
.leaflet-container a{color:#0078A8}
.leaflet-zoom-box{border:2px dotted #38f;background:rgba(255,255,255,.5)}
.leaflet-container{font-family:"Helvetica Neue",Arial,Helvetica,sans-serif;font-size:12px;font-size:.75rem;line-height:1.5}
.leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,.65);border-radius:4px}
.leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:#000}
.leaflet-bar a,.leaflet-control-layers-toggle{background-position:50% 50%;background-repeat:no-repeat;display:block}
.leaflet-bar a:hover,.leaflet-bar a:focus{background-color:#f4f4f4}
.leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none}
.leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb}
.leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px}
.leaflet-touch .leaflet-bar a:first-child{border-top-left-radius:2px;border-top-right-radius:2px}
.leaflet-touch .leaflet-bar a:last-child{border-bottom-left-radius:2px;border-bottom-right-radius:2px}
.leaflet-control-zoom-in,.leaflet-control-zoom-out{font:bold 18px 'Lucida Console',Monaco,monospace;text-indent:1px}
.leaflet-touch .leaflet-control-zoom-in,.leaflet-touch .leaflet-control-zoom-out{font-size:22px}
.leaflet-control-layers{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#fff;border-radius:5px}
.leaflet-control-layers-toggle{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");width:36px;height:36px}
.leaflet-retina .leaflet-control-layers-toggle{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");background-size:26px 26px}
.leaflet-touch .leaflet-control-layers-toggle{width:44px;height:44px}
.leaflet-control-layers .leaflet-control-layers-list,.leaflet-control-layers-expanded .leaflet-control-layers-toggle{display:none}
.leaflet-control-layers-expanded .leaflet-control-layers-list{display:block;position:relative}
.leaflet-control-layers-expanded{padding:6px 10px 6px 6px;color:#333;background:#fff}
.leaflet-control-layers-scrollbar{overflow-y:scroll;overflow-x:hidden;padding-right:5px}
.leaflet-control-layers-selector{margin-top:2px;position:relative;top:1px}
.leaflet-control-layers label{display:block;font-size:13px;font-size:1.08333em}
.leaflet-control-layers-separator{height:0;border-top:1px solid #ddd;margin:5px -10px 5px -6px}
.leaflet-default-icon-path{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")}
.leaflet-container .leaflet-control-attribution{background:#fff;background:rgba(255,255,255,.8);margin:0}
.leaflet-control-attribution,.leaflet-control-scale-line{padding:0 5px;color:#333;line-height:1.4}
.leaflet-control-attribution a{text-decoration:none}
.leaflet-control-attribution a:hover,.leaflet-control-attribution a:focus{text-decoration:underline}
.leaflet-attribution-flag{display:inline!important;vertical-align:baseline!important;width:1em;height:.6669em}
.leaflet-left .leaflet-control-scale{margin-left:5px}
.leaflet-bottom .leaflet-control-scale{margin-bottom:5px}
.leaflet-control-scale-line{border:2px solid #777;border-top:none;line-height:1.1;padding:2px 5px 1px;white-space:nowrap;-moz-box-sizing:border-box;box-sizing:border-box;background:rgba(255,255,255,.8);text-shadow:1px 1px #fff}
.leaflet-control-scale-line:not(:first-child){border-top:2px solid #777;border-bottom:none;margin-top:-2px}
.leaflet-control-scale-line:not(:first-child):not(:last-child){border-bottom:2px solid #777}
.leaflet-touch .leaflet-control-attribution,.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{box-shadow:none}
.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{border:2px solid rgba(0,0,0,.2);background-clip:padding-box}
.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}
.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}
.leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:13px;font-size:1.08333em;min-height:1px}
.leaflet-popup-content p{margin:17px 0;margin:1.3em 0}
.leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-top:-1px;margin-left:-20px;overflow:hidden;pointer-events:none}
.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;pointer-events:auto;-webkit-transform:rotate(45deg);-moz-transform:rotate(45deg);-ms-transform:rotate(45deg);transform:rotate(45deg)}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#fff;color:#333;box-shadow:0 3px 14px rgba(0,0,0,.4)}
.leaflet-container a.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma,Verdana,sans-serif;color:#757575;text-decoration:none;background:transparent}
.leaflet-container a.leaflet-popup-close-button:hover,.leaflet-container a.leaflet-popup-close-button:focus{color:#585858}
.leaflet-popup-scrolled{overflow:auto}
.leaflet-oldie .leaflet-popup-content-wrapper{-ms-zoom:1}
.leaflet-oldie .leaflet-popup-tip{width:24px;margin:0 auto;-ms-filter:"progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";filter:progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678,M12=0.70710678,M21=-0.70710678,M22=0.70710678)}
.leaflet-oldie .leaflet-control-zoom,.leaflet-oldie .leaflet-control-layers,.leaflet-oldie .leaflet-popup-content-wrapper,.leaflet-oldie .leaflet-popup-tip{border:1px solid #999}
.leaflet-div-icon{background:#fff;border:1px solid #666}
.leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #fff;border-radius:3px;color:#222;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.leaflet-tooltip.leaflet-interactive{cursor:pointer;pointer-events:auto}
.leaflet-tooltip-top:before,.leaflet-tooltip-bottom:before,.leaflet-tooltip-left:before,.leaflet-tooltip-right:before{position:absolute;pointer-events:none;border:6px solid transparent;background:transparent;content:""}
.leaflet-tooltip-bottom{margin-top:6px}
.leaflet-tooltip-top{margin-top:-6px}
.leaflet-tooltip-bottom:before,.leaflet-tooltip-top:before{left:50%;margin-left:-6px}
.leaflet-tooltip-top:before{bottom:0;margin-bottom:-12px;border-top-color:#fff}
.leaflet-tooltip-bottom:before{top:0;margin-top:-12px;margin-left:-6px;border-bottom-color:#fff}
.leaflet-tooltip-left{margin-left:-6px}
.leaflet-tooltip-right{margin-left:6px}
.leaflet-tooltip-left:before,.leaflet-tooltip-right:before{top:50%;margin-top:-6px}
.leaflet-tooltip-left:before{right:0;margin-right:-12px;border-left-color:#fff}
.leaflet-tooltip-right:before{left:0;margin-left:-12px;border-right-color:#fff}
@media print{.leaflet-control{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.leaflet-container{width:100%!important;height:100%!important;background:#e8e8e8}
.leaflet-control-attribution{font-size:10px}
`;

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
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = INJECTED_CSS;
      document.head.appendChild(style);
    }

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
    const raw = context.parameters.occurrencesJson.raw;
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.reduce<OccurrencePoint[]>((acc, item) => {
        const lat = Number(item.lat ?? item.latitude);
        const lng = Number(item.lng ?? item.longitude);
        if (isNaN(lat) || isNaN(lng)) return acc;
        acc.push({
          lat,
          lng,
          weight: item.weight != null && !isNaN(Number(item.weight)) ? Number(item.weight) : 1,
          label: item.label != null ? String(item.label) : "",
        });
        return acc;
      }, []);
    } catch {
      return [];
    }
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

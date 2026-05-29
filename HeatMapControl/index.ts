import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as L from "leaflet";
import "leaflet.heat";

interface OccurrencePoint {
  lat: number;
  lng: number;
  weight: number;
  label: string;
}

const DEFAULT_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const HEAT_GRADIENT: { [key: number]: string } = {
  0.1: "#FFEDA0",
  0.3: "#FEB24C",
  0.5: "#FD8D3C",
  0.7: "#FC4E2A",
  0.85: "#E31A1C",
  1.0: "#B10026",
};

const STYLE_ID = "pm-heatmap-styles";
const INJECTED_CSS = `
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden}
.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none}
.leaflet-tile::selection{background:transparent}
.leaflet-marker-icon,.leaflet-marker-shadow{display:block}
.leaflet-container .leaflet-overlay-pane svg{max-width:none!important;max-height:none!important}
.leaflet-container .leaflet-marker-pane img,.leaflet-container .leaflet-shadow-pane img,.leaflet-container .leaflet-tile-pane img,.leaflet-container img.leaflet-image-layer,.leaflet-container .leaflet-tile{max-width:none!important;max-height:none!important;width:auto;padding:0}
.leaflet-container.leaflet-touch-zoom{-ms-touch-action:pan-x pan-y;touch-action:pan-x pan-y}
.leaflet-container.leaflet-touch-drag{-ms-touch-action:pinch-zoom;touch-action:none;touch-action:pinch-zoom}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{-ms-touch-action:none;touch-action:none}
.leaflet-container{-webkit-tap-highlight-color:transparent;background:#ddd;outline-offset:1px;font-family:"Helvetica Neue",Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5}
.leaflet-container a{-webkit-tap-highlight-color:rgba(51,181,229,.4);color:#0078A8}
.leaflet-tile{filter:inherit;visibility:hidden}
.leaflet-tile-loaded{visibility:inherit}
.leaflet-zoom-box{width:0;height:0;box-sizing:border-box;z-index:800}
.leaflet-overlay-pane svg{-moz-user-select:none}
.leaflet-pane{z-index:400}.leaflet-tile-pane{z-index:200}.leaflet-overlay-pane{z-index:400}.leaflet-shadow-pane{z-index:500}.leaflet-marker-pane{z-index:600}.leaflet-tooltip-pane{z-index:650}.leaflet-popup-pane{z-index:700}
.leaflet-map-pane canvas{z-index:100}.leaflet-map-pane svg{z-index:200}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}.leaflet-right{right:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}
.leaflet-control{float:left;clear:both}
.leaflet-right .leaflet-control{float:right}
.leaflet-top .leaflet-control{margin-top:10px}.leaflet-bottom .leaflet-control{margin-bottom:10px}
.leaflet-left .leaflet-control{margin-left:10px}.leaflet-right .leaflet-control{margin-right:10px}
.leaflet-fade-anim .leaflet-popup{opacity:0;transition:opacity .2s linear}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1}
.leaflet-zoom-animated{transform-origin:0 0}
svg.leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-zoom-animated{transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-zoom-anim .leaflet-tile,.leaflet-pan-anim .leaflet-tile{transition:none}
.leaflet-zoom-anim .leaflet-zoom-hide{visibility:hidden}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:grab}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,.leaflet-dragging .leaflet-marker-draggable{cursor:grabbing}
.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-image-layer,.leaflet-pane>svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-image-layer.leaflet-interactive,.leaflet-pane>svg path.leaflet-interactive,svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto}
.leaflet-zoom-box{border:2px dotted #38f;background:rgba(255,255,255,.5)}
.leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,.65);border-radius:4px}
.leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:#000}
.leaflet-bar a:hover,.leaflet-bar a:focus{background-color:#f4f4f4}
.leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none}
.leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb}
.leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px}
.leaflet-control-zoom-in,.leaflet-control-zoom-out{font:bold 18px 'Lucida Console',Monaco,monospace;text-indent:1px}
.leaflet-touch .leaflet-control-zoom-in,.leaflet-touch .leaflet-control-zoom-out{font-size:22px}
.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}
.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}
.leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:13px;min-height:1px}
.leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-top:-1px;margin-left:-20px;overflow:hidden;pointer-events:none}
.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;pointer-events:auto;transform:rotate(45deg)}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#fff;color:#333;box-shadow:0 3px 14px rgba(0,0,0,.4)}
.leaflet-container a.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma,Verdana,sans-serif;color:#757575;text-decoration:none;background:transparent}
.leaflet-popup-scrolled{overflow:auto}
`;

function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = INJECTED_CSS;
  document.head.appendChild(style);
}

function parsePoints(raw: string | null): OccurrencePoint[] {
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
        weight:
          item.weight != null && !isNaN(Number(item.weight))
            ? Number(item.weight)
            : 1,
        label: item.label != null ? String(item.label) : "",
      });
      return acc;
    }, []);
  } catch {
    return [];
  }
}

interface MapProps {
  points: OccurrencePoint[];
  enableHeatmap: boolean;
  heatRadius: number;
  heatBlur: number;
  heatIntensity: number;
  heatMaxZoom: number;
  initialLat: number;
  initialLng: number;
  initialZoom: number;
  tileUrl: string;
  width: number;
  height: number;
  mapRef: React.MutableRefObject<L.Map | null>;
}

const HeatMap: React.FC<MapProps> = (props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const heatLayerRef = React.useRef<L.HeatLayer | null>(null);
  const markerLayerRef = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    injectStyles();
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Remove any leftover Leaflet state from a previous mount on this element
    const anyEl = el as any;
    if (anyEl._leaflet_id) {
      try { props.mapRef.current?.remove(); } catch { /* ignore */ }
      props.mapRef.current = null;
      heatLayerRef.current = null;
      markerLayerRef.current = null;
      delete anyEl._leaflet_id;
    }

    let map: L.Map;
    try {
      map = L.map(el, {
        center: [props.initialLat, props.initialLng],
        zoom: props.initialZoom,
        attributionControl: false,
        preferCanvas: true,
      });
    } catch (e) {
      return;
    }

    L.tileLayer(props.tileUrl || DEFAULT_TILE_URL, { maxZoom: 19 }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    props.mapRef.current = map;

    return () => {
      heatLayerRef.current = null;
      markerLayerRef.current = null;
      props.mapRef.current = null;
      try { map.remove(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.mapRef.current) {
      props.mapRef.current.invalidateSize();
    }
  }, [props.width, props.height, props.mapRef]);

  React.useEffect(() => {
    const map = props.mapRef.current;
    if (!map) return;

    if (props.enableHeatmap) {
      if (markerLayerRef.current) markerLayerRef.current.clearLayers();
      if (heatLayerRef.current) {
        try { map.removeLayer(heatLayerRef.current); } catch { /* ignore */ }
        heatLayerRef.current = null;
      }
      const latlngs: L.HeatLatLngTuple[] = props.points.map((p) => [p.lat, p.lng, p.weight]);
      try {
        heatLayerRef.current = L.heatLayer(latlngs, {
          radius: props.heatRadius,
          maxZoom: props.heatMaxZoom,
          blur: props.heatBlur,
          max: Math.max(1, props.heatIntensity),
          minOpacity: 0.4,
          gradient: HEAT_GRADIENT,
        });
        heatLayerRef.current.addTo(map);
      } catch { /* ignore */ }
    } else {
      if (heatLayerRef.current) {
        try { map.removeLayer(heatLayerRef.current); } catch { /* ignore */ }
        heatLayerRef.current = null;
      }
      if (!markerLayerRef.current) {
        markerLayerRef.current = L.layerGroup().addTo(map);
      } else {
        markerLayerRef.current.clearLayers();
      }
      for (const pt of props.points) {
        try {
          const m = L.circleMarker([pt.lat, pt.lng], {
            color: "#C8185A",
            fillColor: "#C8185A",
            fillOpacity: 0.7,
            radius: 7,
            weight: 1,
          });
          if (pt.label) m.bindPopup(pt.label);
          m.addTo(markerLayerRef.current);
        } catch { /* ignore */ }
      }
    }
  }, [props.points, props.enableHeatmap, props.heatRadius, props.heatBlur, props.heatIntensity, props.heatMaxZoom, props.mapRef]);

  const wrapperStyle: React.CSSProperties = {
    width: props.width > 0 ? props.width + "px" : "100%",
    height: props.height > 0 ? props.height + "px" : "100%",
    position: "relative",
  };

  return React.createElement(
    "div",
    { style: wrapperStyle },
    React.createElement("div", {
      ref: containerRef,
      style: { width: "100%", height: "100%" },
    })
  );
};

export class HeatMapControl
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
  private _mapRef: React.MutableRefObject<L.Map | null> = { current: null };

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary
  ): void {
    void context;
  }

  updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    const props = context.parameters;
    return React.createElement(HeatMap, {
      points: parsePoints(props.occurrencesJson.raw),
      enableHeatmap: props.enableHeatmap.raw ?? true,
      heatRadius: (props.heatRadius.raw as number) ?? 50,
      heatBlur: (props.heatBlur.raw as number) ?? 25,
      heatIntensity: (props.heatIntensity.raw as number) ?? 3,
      heatMaxZoom: (props.heatMaxZoom.raw as number) ?? 17,
      initialLat: (props.initialLat.raw as number) ?? -22.2171,
      initialLng: (props.initialLng.raw as number) ?? -49.9501,
      initialZoom: (props.initialZoom.raw as number) ?? 12,
      tileUrl: (props.tileUrl.raw as string | null) ?? "",
      width: context.mode.allocatedWidth,
      height: context.mode.allocatedHeight,
      mapRef: this._mapRef,
    });
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    if (this._mapRef.current) {
      try { this._mapRef.current.remove(); } catch { /* ignore */ }
      this._mapRef.current = null;
    }
  }
}

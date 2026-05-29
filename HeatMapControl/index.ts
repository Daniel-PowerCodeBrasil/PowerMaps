import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as L from "leaflet";
import "leaflet.heat";

interface OccurrencePoint {
  lat: number;
  lng: number;
  weight: number;
  label: string;
  count: number;
}

const DEFAULT_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Centroides aproximados dos 27 estados do Brasil (26 estados + DF).
// Indexados tanto pela sigla (UF) quanto pelo nome normalizado, para que uma
// ocorrência com "uf":"SP" ou "estado":"São Paulo" seja resolvida sem configuração.
const BR_STATE_CENTROIDS: { [key: string]: [number, number] } = {
  ac: [-9.02, -70.81], acre: [-9.02, -70.81],
  al: [-9.62, -36.66], alagoas: [-9.62, -36.66],
  ap: [0.9, -52.0], amapa: [0.9, -52.0],
  am: [-4.15, -64.7], amazonas: [-4.15, -64.7],
  ba: [-12.5, -41.7], bahia: [-12.5, -41.7],
  ce: [-5.09, -39.62], ceara: [-5.09, -39.62],
  df: [-15.78, -47.93], "distrito federal": [-15.78, -47.93],
  es: [-19.57, -40.66], "espirito santo": [-19.57, -40.66],
  go: [-15.93, -50.14], goias: [-15.93, -50.14],
  ma: [-4.96, -45.27], maranhao: [-4.96, -45.27],
  mt: [-13.0, -55.4], "mato grosso": [-13.0, -55.4],
  ms: [-20.5, -54.6], "mato grosso do sul": [-20.5, -54.6],
  mg: [-18.5, -44.5], "minas gerais": [-18.5, -44.5],
  pa: [-4.0, -52.9], para: [-4.0, -52.9],
  pb: [-7.12, -36.72], paraiba: [-7.12, -36.72],
  pr: [-24.6, -51.6], parana: [-24.6, -51.6],
  pe: [-8.4, -37.9], pernambuco: [-8.4, -37.9],
  pi: [-7.7, -42.7], piaui: [-7.7, -42.7],
  rj: [-22.25, -42.66], "rio de janeiro": [-22.25, -42.66],
  rn: [-5.81, -36.59], "rio grande do norte": [-5.81, -36.59],
  rs: [-30.0, -53.5], "rio grande do sul": [-30.0, -53.5],
  ro: [-10.9, -63.3], rondonia: [-10.9, -63.3],
  rr: [2.0, -61.4], roraima: [2.0, -61.4],
  sc: [-27.4, -50.9], "santa catarina": [-27.4, -50.9],
  sp: [-22.2, -48.8], "sao paulo": [-22.2, -48.8],
  se: [-10.6, -37.4], sergipe: [-10.6, -37.4],
  to: [-10.2, -48.3], tocantins: [-10.2, -48.3],
};

// Remove acentos, baixa caixa e apara espaços — para casar nomes de lugares
// independente de como foram digitados ("São Paulo" === "sao paulo").
function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
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

type Coord = [number, number];
type PlaceTable = { [key: string]: Coord };

// Constrói uma tabela de lookup (nome normalizado -> coordenada) a partir do JSON
// fornecido pelo usuário em `placesJson`. Aceita dois formatos:
//   1) Array: [{ "cidade":"Bauru", "bairro":"Centro", "lat":-22.3, "lng":-49.0 }, ...]
//   2) Objeto: { "bauru": {"lat":-22.3,"lng":-49.0}, "bauru/centro": {...} }
// Para o formato em array, indexamos por cidade/bairro, por bairro e por cidade,
// para casar a chave mais específica disponível na ocorrência.
function parsePlaceTable(raw: string | null): PlaceTable {
  const table: PlaceTable = {};
  if (!raw) return table;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return table;
  }

  const put = (key: string, lat: number, lng: number) => {
    if (key) table[key] = [lat, lng];
  };

  if (Array.isArray(parsed)) {
    for (const p of parsed) {
      const lat = Number(p.lat ?? p.latitude);
      const lng = Number(p.lng ?? p.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;
      const cidade = normalize(p.cidade ?? p.city);
      const bairro = normalize(p.bairro ?? p.neighborhood ?? p.district);
      const nome = normalize(p.name ?? p.nome);
      if (cidade && bairro) put(`${cidade}/${bairro}`, lat, lng);
      if (bairro) put(bairro, lat, lng);
      if (cidade) put(cidade, lat, lng);
      if (nome) put(nome, lat, lng);
    }
  } else if (parsed && typeof parsed === "object") {
    for (const key of Object.keys(parsed as Record<string, unknown>)) {
      const v = (parsed as Record<string, { lat?: number; lng?: number; latitude?: number; longitude?: number }>)[key];
      const lat = Number(v.lat ?? v.latitude);
      const lng = Number(v.lng ?? v.longitude);
      if (!isNaN(lat) && !isNaN(lng)) put(normalize(key), lat, lng);
    }
  }
  return table;
}

// Resolve a coordenada de uma ocorrência, em cascata:
//   1) lat/lng explícitos (mais preciso) — usados como estão
//   2) cidade + bairro -> tabela do usuário
//   3) bairro -> tabela do usuário
//   4) cidade -> tabela do usuário
//   5) uf/estado -> tabela embutida dos estados do Brasil
// Retorna null quando nenhum critério resolve (a ocorrência é ignorada).
function resolveLocation(item: any, places: PlaceTable): Coord | null {
  const lat = Number(item.lat ?? item.latitude);
  const lng = Number(item.lng ?? item.longitude);
  if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];

  const cidade = normalize(item.cidade ?? item.city);
  const bairro = normalize(item.bairro ?? item.neighborhood ?? item.district);

  const candidates: string[] = [];
  if (cidade && bairro) candidates.push(`${cidade}/${bairro}`);
  if (bairro) candidates.push(bairro);
  if (cidade) candidates.push(cidade);
  for (const key of candidates) {
    if (places[key]) return places[key];
  }

  const uf = normalize(item.uf ?? item.estado ?? item.state);
  if (uf && BR_STATE_CENTROIDS[uf]) return BR_STATE_CENTROIDS[uf];

  return null;
}

// Texto de fallback para o rótulo, quando a ocorrência não traz `label`.
function defaultLabel(item: any): string {
  const parts = [
    item.bairro ?? item.neighborhood ?? item.district,
    item.cidade ?? item.city,
    item.uf ?? item.estado ?? item.state,
  ].filter((p) => p != null && String(p).trim() !== "");
  return parts.map((p) => String(p)).join(" - ");
}

function parsePoints(raw: string | null, places: PlaceTable): OccurrencePoint[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  // Agrega ocorrências que caem no mesmo ponto (~11 m). Para o calor, os pesos
  // somam, refletindo a contagem; para marcadores, vira um único pino com total.
  const agg = new Map<string, OccurrencePoint>();
  for (const item of parsed) {
    const coord = resolveLocation(item, places);
    if (!coord) continue;
    const [lat, lng] = coord;
    const weight =
      item.weight != null && !isNaN(Number(item.weight))
        ? Number(item.weight)
        : 1;
    const label = item.label != null ? String(item.label) : defaultLabel(item);
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const existing = agg.get(key);
    if (existing) {
      existing.weight += weight;
      existing.count += 1;
      if (!existing.label && label) existing.label = label;
    } else {
      agg.set(key, { lat, lng, weight, label, count: 1 });
    }
  }
  return Array.from(agg.values());
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

    // The PCF/Canvas container is frequently sized AFTER the map is created
    // (allocatedWidth/Height arrives as 0 on first render). Leaflet caches the
    // viewport size at init time and only loads tiles for that area, leaving the
    // rest of the container blank. A ResizeObserver on the real DOM element fixes
    // this by recomputing the size whenever the container actually changes.
    let resizeObserver: ResizeObserver | null = null;
    let lastW = 0;
    let lastH = 0;
    const refresh = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        lastW = w;
        lastH = h;
        map.invalidateSize({ animate: false });
      }
    };

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => refresh());
      resizeObserver.observe(el);
    }

    // Belt-and-suspenders: also nudge the map a few times after layout settles,
    // covering browsers/hosts where the observer fires before the final size.
    const timers = [0, 100, 300, 600, 1000].map((ms) =>
      window.setTimeout(() => refresh(), ms)
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (resizeObserver) {
        try { resizeObserver.disconnect(); } catch { /* ignore */ }
      }
      heatLayerRef.current = null;
      markerLayerRef.current = null;
      props.mapRef.current = null;
      try { map.remove(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const map = props.mapRef.current;
    if (!map) return;
    map.invalidateSize({ animate: false });
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
            // Pontos agregados (várias ocorrências no mesmo local) ganham um
            // raio um pouco maior, para dar uma noção visual de volume.
            radius: pt.count > 1 ? Math.min(7 + pt.count, 18) : 7,
            weight: 1,
          });
          const base = pt.label || "Local";
          const popup =
            pt.count > 1 ? `${base}: ${pt.count} ocorrências` : base;
          m.bindPopup(popup);
          m.addTo(markerLayerRef.current);
        } catch { /* ignore */ }
      }
    }
  }, [props.points, props.enableHeatmap, props.heatRadius, props.heatBlur, props.heatIntensity, props.heatMaxZoom, props.mapRef]);

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  };

  const mapStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  };

  return React.createElement(
    "div",
    { style: wrapperStyle },
    React.createElement("div", {
      ref: containerRef,
      style: mapStyle,
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
    const placeTable = parsePlaceTable(props.placesJson.raw);
    return React.createElement(HeatMap, {
      points: parsePoints(props.occurrencesJson.raw, placeTable),
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

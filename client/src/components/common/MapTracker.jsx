// components/common/MapTracker.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Package, Truck, User, MapPin, Navigation, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const TRACKER_API = import.meta.env.VITE_TRACKER_API;

// ── Geocode an address string via Geoapify ───────────────────────────────────
const geocode = async (address) => {
  const { data } = await axios.get("https://api.geoapify.com/v1/geocode/search", {
    params: { text: `${address}, Philippines`, apiKey: TRACKER_API, limit: 1 },
    headers: { "Accept-Language": "en" },
  });
  if (!data.features?.length) throw new Error(`Could not locate: "${address}"`);
  const { lat, lon } = data.features[0].properties;
  return { lat: parseFloat(lat), lng: parseFloat(lon) };
};

// ── Fetch driving route from OSRM ────────────────────────────────────────────
const fetchRoute = async (from, to) => {
  try {
    const { data } = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
      { params: { overview: "full", geometries: "geojson" } }
    );
    if (!data.routes?.length) return [];
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch { return []; }
};

// ── Parse { lat, lng } or { lat, lang } object ───────────────────────────────
const parseCoords = (c) => {
  if (!c || typeof c !== "object") return null;
  const lat = parseFloat(c.lat);
  const lng = parseFloat(c.lng ?? c.lang);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

// ── SVG markers ───────────────────────────────────────────────────────────────
const makePinSvg = (color, label) => `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <defs><filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000044"/></filter></defs>
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#sh)"/>
  <circle cx="18" cy="18" r="9" fill="white" opacity="0.95"/>
  <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="700" font-family="monospace" fill="${color}">${label}</text>
</svg>`;

const makePulseSvg = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
  <circle cx="24" cy="20" r="18" fill="${color}" opacity="0.15"/>
  <circle cx="24" cy="20" r="12" fill="${color}" opacity="0.25"/>
  <path d="M24 4C14.06 4 6 12.06 6 22c0 13.5 18 26 18 26S42 35.5 42 22C42 12.06 33.94 4 24 4z" fill="${color}"/>
  <circle cx="24" cy="22" r="9" fill="white" opacity="0.95"/>
  <text x="24" y="26" text-anchor="middle" font-size="11" font-weight="700" font-family="monospace" fill="${color}">L</text>
</svg>`;

const haversine = (a, b) => {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))).toFixed(1);
};

const MC = { seller: "#2563eb", logistics: "#16a34a", buyer: "#9333ea" };
const CARD_CLS = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-700"   },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  badge: "bg-green-100 text-green-700"  },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   sellerLocation    {string}  — always required, geocoded once
//   buyerLocation     {string}  — always required, geocoded once
//   logisticsLocation {object|null} — { lat, lng } live GPS, or null when not tracking
//
// Map behaviour:
//   • Seller (S) + Buyer (B) markers draw immediately on load
//   • Logistics (L) pulsing marker appears only when logisticsLocation is provided
//   • Routes redraw whenever logistics coords change
//   • Passing null for logisticsLocation removes the logistics marker + routes
// ─────────────────────────────────────────────────────────────────────────────
export default function MapTracker({ sellerLocation = "", buyerLocation = "", logisticsLocation = null }) {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const mapObjRef   = useRef(null);

  // Permanent layers (seller + buyer markers) — cleared only on address change
  const staticLayersRef   = useRef([]);
  // Dynamic layers (logistics marker + routes) — cleared on every logistics update
  const dynamicLayersRef  = useRef([]);

  const [staticCoords,   setStaticCoords]   = useState({ seller: null, buyer: null });
  const [logisticsCoords, setLogisticsCoords] = useState(null);
  const [geocodeStatus,  setGeocodeStatus]  = useState("idle"); // idle|loading|done|error
  const [geocodeError,   setGeocodeError]   = useState("");
  const [expanded,       setExpanded]       = useState(null);

  // ── Leaflet CSS ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = Object.assign(document.createElement("link"), {
        id: "leaflet-css", rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      });
      document.head.appendChild(link);
    }
  }, []);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    let iv;
    const tryInit = () => {
      if (!window.L || !mapRef.current || mapObjRef.current) return;
      clearInterval(iv);
      leafletRef.current = window.L;
      const map = window.L.map(mapRef.current, { zoomControl: false }).setView([16.04, 120.33], 11);
      window.L.control.zoom({ position: "bottomright" }).addTo(map);
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19,
      }).addTo(map);
      mapObjRef.current = map;
    };
    if (!window.L) {
      document.body.appendChild(Object.assign(document.createElement("script"), {
        src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", async: true,
      }));
    }
    iv = setInterval(tryInit, 100);
    return () => clearInterval(iv);
  }, []);

  // ── Geocode seller + buyer — runs once (or when addresses change) ─────────
  useEffect(() => {
    if (!sellerLocation || !buyerLocation) return;
    let cancelled = false;
    setGeocodeStatus("loading");
    (async () => {
      try {
        const [s, b] = await Promise.all([geocode(sellerLocation), geocode(buyerLocation)]);
        if (!cancelled) {
          setStaticCoords({ seller: s, buyer: b });
          setGeocodeStatus("done");
          setGeocodeError("");
        }
      } catch (err) {
        if (!cancelled) {
          setGeocodeError(err.response?.data?.message || err.message || "Failed to geocode address.");
          setGeocodeStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sellerLocation, buyerLocation]);

  // ── Draw seller + buyer markers once geocoding is done ────────────────────
  useEffect(() => {
    const { seller, buyer } = staticCoords;
    if (!seller || !buyer || !mapObjRef.current) return;

    const L   = leafletRef.current;
    const map = mapObjRef.current;

    // Clear old static markers
    staticLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    staticLayersRef.current = [];

    const mkIcon = (svg, sz, anc) =>
      L.divIcon({ html: svg, className: "", iconSize: sz, iconAnchor: anc, popupAnchor: [0, -44] });

    const addStatic = (l) => { l.addTo(map); staticLayersRef.current.push(l); };

    addStatic(L.marker([seller.lat, seller.lng], {
      icon: mkIcon(makePinSvg(MC.seller, "S"), [36,44],[18,44]), zIndexOffset: 100,
    }).bindPopup(`<b>📦 Seller</b><br/><small>${sellerLocation}</small>`));

    addStatic(L.marker([buyer.lat, buyer.lng], {
      icon: mkIcon(makePinSvg(MC.buyer, "B"), [36,44],[18,44]), zIndexOffset: 100,
    }).bindPopup(`<b>🏠 Buyer</b><br/><small>${buyerLocation}</small>`));

    // Fit map to seller + buyer
    map.fitBounds(
      L.latLngBounds([[seller.lat, seller.lng],[buyer.lat, buyer.lng]]).pad(0.25)
    );
  }, [staticCoords]);

  // ── Parse incoming logistics coords ──────────────────────────────────────
  useEffect(() => {
    const parsed = parseCoords(logisticsLocation);
    setLogisticsCoords(parsed); // null clears the marker
  }, [logisticsLocation]);

  // ── Draw / update logistics marker + routes ───────────────────────────────
  useEffect(() => {
    const { seller, buyer } = staticCoords;
    if (!seller || !buyer || !mapObjRef.current) return;

    const L   = leafletRef.current;
    const map = mapObjRef.current;

    // Always clear old dynamic layers first
    dynamicLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    dynamicLayersRef.current = [];

    if (!logisticsCoords) {
      // No logistics — keep map showing seller + buyer, no routes
      return;
    }

    const lo = logisticsCoords;
    const addDynamic = (l) => { l.addTo(map); dynamicLayersRef.current.push(l); };

    const mkIcon = (svg, sz, anc) =>
      L.divIcon({ html: svg, className: "", iconSize: sz, iconAnchor: anc, popupAnchor: [0, -44] });

    // Add logistics marker immediately (don't wait for routes)
    addDynamic(L.marker([lo.lat, lo.lng], {
      icon: mkIcon(makePulseSvg(MC.logistics), [48,56],[24,56]), zIndexOffset: 200,
    }).bindPopup(`<b>🚚 Logistics</b><br/><small>${lo.lat.toFixed(5)}, ${lo.lng.toFixed(5)}</small>`));

    // Fit to all 3 points
    map.fitBounds(
      L.latLngBounds([[seller.lat, seller.lng],[buyer.lat, buyer.lng],[lo.lat, lo.lng]]).pad(0.18)
    );

    // Fetch + draw routes async (marker is already visible while this loads)
    (async () => {
      try {
        const [rSL, rLB] = await Promise.all([fetchRoute(seller, lo), fetchRoute(lo, buyer)]);
        if (!mapObjRef.current) return;
        if (rSL.length) addDynamic(L.polyline(rSL, { color: MC.seller,    weight: 4, opacity: 0.55, dashArray: "8 6" }));
        if (rLB.length) addDynamic(L.polyline(rLB, { color: MC.buyer,     weight: 4, opacity: 0.55, dashArray: "8 6" }));
        addDynamic(L.polyline([[seller.lat,seller.lng],[lo.lat,lo.lng],[buyer.lat,buyer.lng]], { color: MC.logistics, weight: 2, opacity: 0.2 }));
      } catch (_) { /* routes are optional — map works without them */ }
    })();
  }, [logisticsCoords, staticCoords]);

  // ── Distances ─────────────────────────────────────────────────────────────
  const { seller, buyer } = staticCoords;
  const lo = logisticsCoords;
  const distSL    = seller && lo    ? haversine(seller, lo)    : null;
  const distLB    = lo     && buyer ? haversine(lo, buyer)     : null;
  const distTotal = seller && buyer ? haversine(seller, buyer) : null;

  const logisticsDisplay = lo
    ? `${lo.lat.toFixed(5)}, ${lo.lng.toFixed(5)}`
    : "Waiting for logistics GPS…";

  const cards = [
    { key: "seller",    icon: Package, label: "Seller",    address: sellerLocation || "—",  color: "blue",   dist: distSL    ? `${distSL} km to logistics` : null },
    { key: "logistics", icon: Truck,   label: "Logistics", address: logisticsDisplay,        color: "green",  dist: distLB    ? `${distLB} km to buyer`     : null, pulse: !!lo },
    { key: "buyer",     icon: User,    label: "Buyer",     address: buyerLocation   || "—",  color: "purple", dist: distTotal ? `${distTotal} km total`      : null },
  ];

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-green-600" /> Live Tracking
        </h4>
        {geocodeStatus === "error" && (
          <button
            onClick={() => {
              setGeocodeStatus("idle");
              setStaticCoords({ seller: null, buyer: null });
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-700 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-green-300 hover:bg-green-50 transition-colors">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative h-64 rounded-xl overflow-hidden border border-gray-200 mb-3">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />

        {/* Loading overlay — only while geocoding, not while waiting for logistics */}
        {geocodeStatus === "loading" && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] gap-2">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-gray-600">Loading map…</p>
          </div>
        )}

        {/* Error overlay */}
        {geocodeStatus === "error" && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-[9999] gap-2 p-4">
            <MapPin className="w-6 h-6 text-red-400" />
            <p className="text-xs text-red-600 font-semibold text-center">{geocodeError}</p>
            <button
              onClick={() => {
                setGeocodeStatus("idle");
                setStaticCoords({ seller: null, buyer: null });
              }}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
              Retry
            </button>
          </div>
        )}

        {/* Logistics not yet online badge — map is visible with S+B markers */}
        {geocodeStatus === "done" && !lo && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
              Waiting for logistics to pick up order
            </p>
          </div>
        )}

        {/* Distance badge — shown when all 3 are present */}
        {geocodeStatus === "done" && lo && distTotal && (
          <div className="absolute top-2 left-2 z-[1000] bg-white/95 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <p className="text-[10px] text-gray-400">Total distance</p>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {distTotal} <span className="text-xs font-normal text-gray-500">km</span>
            </p>
          </div>
        )}
      </div>

      {/* Location cards */}
      <div className="space-y-1.5">
        {cards.map(card => {
          const Icon = card.icon;
          const cc   = CARD_CLS[card.color];
          const open = expanded === card.key;
          return (
            <div key={card.key} className={`rounded-xl border ${cc.border} ${cc.bg} overflow-hidden`}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => setExpanded(open ? null : card.key)}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cc.badge}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${cc.text}`}>{card.label}</p>
                  <p className="text-xs text-gray-600 truncate">{card.address}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {card.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                  {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </div>
              </button>

              {open && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100">
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">{card.address}</p>
                  {card.key === "seller"    && seller && <p className="text-[10px] text-gray-400 font-mono">{seller.lat.toFixed(5)}, {seller.lng.toFixed(5)}</p>}
                  {card.key === "buyer"     && buyer  && <p className="text-[10px] text-gray-400 font-mono">{buyer.lat.toFixed(5)}, {buyer.lng.toFixed(5)}</p>}
                  {card.key === "logistics" && lo     && <p className="text-[10px] text-gray-400 font-mono">{lo.lat.toFixed(5)}, {lo.lng.toFixed(5)}</p>}
                  {card.dist && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cc.badge}`}>
                      <Navigation className="w-2.5 h-2.5" /> {card.dist}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ScoredHostel, RouteSegment } from "@/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Destination {
  label: string;
  lat: number;
  lng: number;
}

interface Props {
  hostels: ScoredHostel[];
  selectedId: string | null;
  onSelectHostel: (id: string) => void;
  destination: Destination | null;
  onSetDestination: (dest: Destination) => void;
  userLocation: { lat: number; lng: number } | null;
  routeSegments: RouteSegment[];
  currencySymbol: string;
}

export default function MapView({
  hostels,
  selectedId,
  onSelectHostel,
  destination,
  onSetDestination,
  userLocation,
  routeSegments,
  currencySymbol,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hostelMarkers = useRef<mapboxgl.Marker[]>([]);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const center: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [72.8777, 19.076];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Click to set destination
    map.current.on("click", (e) => {
      onSetDestination({
        label: "Custom pin",
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    });

    // Change cursor on hover
    map.current.getCanvas().style.cursor = "crosshair";
  }, [userLocation, onSetDestination]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    userMarker.current?.remove();

    const el = document.createElement("div");
    el.style.cssText = `
      width: 18px; height: 18px;
      background: #2563eb;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.25);
    `;

    userMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setText("You are here"))
      .addTo(map.current);

    map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
  }, [userLocation]);

  // Destination pin
  useEffect(() => {
    if (!map.current || !destination) return;

    destinationMarker.current?.remove();

    const el = document.createElement("div");
    el.style.cssText = `
      width: 0; height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 20px solid #ef4444;
      position: relative;
    `;
    const dot = document.createElement("div");
    dot.style.cssText = `
      position: absolute; top: -24px; left: -8px;
      width: 16px; height: 16px;
      background: #ef4444;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    el.appendChild(dot);

    destinationMarker.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([destination.lng, destination.lat])
      .addTo(map.current);
  }, [destination]);

  // Hostel markers
  useEffect(() => {
    if (!map.current) return;
    hostelMarkers.current.forEach((m) => m.remove());
    hostelMarkers.current = [];

    hostels.forEach((sh) => {
      const { hostel: h, rank, aiScore } = sh;
      const isSelected = h.id === selectedId;

      const el = document.createElement("div");
      el.style.cssText = `
        width: ${isSelected ? "52px" : "40px"};
        height: ${isSelected ? "52px" : "40px"};
        border-radius: 50%;
        border: 3px solid ${isSelected ? "#2563eb" : "#fff"};
        background: ${rank === 1 ? "#f59e0b" : rank === 2 ? "#6b7280" : rank === 3 ? "#f97316" : "#3b82f6"};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s;
      `;
      el.textContent = `#${rank}`;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectHostel(h.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="font-size:12px;padding:4px 0;">
              <strong>${h.name}</strong><br/>
              ${currencySymbol}${h.pricePerNight}/night · Score: ${aiScore}/100
            </div>
          `)
        )
        .addTo(map.current!);

      hostelMarkers.current.push(marker);
    });
  }, [hostels, selectedId, onSelectHostel, currencySymbol]);

  // Route overlay
  useEffect(() => {
    if (!map.current || routeSegments.length === 0) return;
    const m = map.current;

    const coords = routeSegments.flatMap((s) => s.coordinates);

    const applyRoute = () => {
      if (m.getSource("route")) {
        (m.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      } else {
        m.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        m.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#2563eb", "line-width": 4, "line-dasharray": [2, 2] },
        });
      }
    };

    if (m.isStyleLoaded()) applyRoute();
    else m.once("load", applyRoute);
  }, [routeSegments]);

  // Fly to selected hostel
  useEffect(() => {
    if (!map.current || !selectedId) return;
    const sh = hostels.find((h) => h.hostel.id === selectedId);
    if (sh) {
      map.current.flyTo({ center: [sh.hostel.lng, sh.hostel.lat], zoom: 13, duration: 1000 });
    }
  }, [selectedId, hostels]);

  return <div ref={mapContainer} className="w-full h-full rounded-xl" />;
}

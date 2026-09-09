import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LandParcel } from '../types';
import { Layers, MapPin, Maximize2, ShieldCheck } from 'lucide-react';

interface CadastralMapProps {
  parcel: LandParcel;
  className?: string;
}

export const CadastralMap: React.FC<CadastralMapProps> = ({ parcel, className = '' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapType, setMapType] = useState<'dark' | 'satellite' | 'street'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates
    const center: [number, number] = [parcel.centerCoordinate.lat, parcel.centerCoordinate.lng];

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer
    const tileLayer = getTileLayer(mapType);
    tileLayer.addTo(map);

    // Marker group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Draw parcel polygon
    drawParcelGeometry(map, parcel);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [parcel]);

  // Update Tile Layer on type change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new layer
    const newLayer = getTileLayer(mapType);
    newLayer.addTo(map);

    // Redraw polygon to ensure it stays on top
    drawParcelGeometry(map, parcel);
  }, [mapType, parcel]);

  const getTileLayer = (type: 'dark' | 'satellite' | 'street'): L.TileLayer => {
    switch (type) {
      case 'satellite':
        return L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        );
      case 'street':
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
      case 'dark':
      default:
        return L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          { maxZoom: 19 }
        );
    }
  };

  const drawParcelGeometry = (map: L.Map, currentParcel: LandParcel) => {
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
    }
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }

    const latLngs: [number, number][] = currentParcel.boundaries.map((b) => [b.lat, b.lng]);

    // Create styled polygon
    const polygon = L.polygon(latLngs, {
      color: '#f59e0b',
      weight: 3,
      fillColor: '#0284c7',
      fillOpacity: 0.35,
      dashArray: '6, 6',
    }).addTo(map);
    polygonLayerRef.current = polygon;

    // Popup for parcel polygon
    polygon.bindPopup(`
      <div style="font-family: sans-serif; color: #0f172a; font-size: 13px; line-height: 1.4;">
        <div style="font-weight: 700; color: #b45309; margin-bottom: 4px;">ULPIN: ${currentParcel.ulpin}</div>
        <div><strong>Survey:</strong> ${currentParcel.surveyNumber}</div>
        <div><strong>Area:</strong> ${currentParcel.areaSqMeters.toLocaleString()} m² (${currentParcel.areaAcres} Acres)</div>
        <div><strong>Owner:</strong> ${currentParcel.ownerOfRecord}</div>
      </div>
    `);

    // Add survey boundary corner markers
    currentParcel.boundaries.forEach((coord, idx) => {
      const customIcon = L.divIcon({
        className: 'custom-survey-marker',
        html: `<div style="background: #0f172a; color: #f59e0b; border: 2px solid #f59e0b; border-radius: 9999px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">P${idx + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([coord.lat, coord.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>Boundary Stone P${idx + 1}</strong><br/>
          Lat: ${coord.lat.toFixed(6)}<br/>
          Lng: ${coord.lng.toFixed(6)}
        </div>
      `);
      if (markersGroupRef.current) {
        markersGroupRef.current.addLayer(marker);
      }
    });

    // Fit bounds nicely with padding
    map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && polygonLayerRef.current) {
      mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 ${className}`}>
      {/* Map container element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map layer controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-xl backdrop-blur-md shadow-lg">
        <button
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            mapType === 'satellite' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapType('dark')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            mapType === 'dark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Cadastre Dark
        </button>
        <button
          onClick={() => setMapType('street')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            mapType === 'street' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Street
        </button>
      </div>

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        title="Fit parcel boundaries"
        className="absolute bottom-4 left-4 z-20 p-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-slate-800 backdrop-blur-md shadow-lg transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Cadastral stamp badge */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg text-[11px] text-slate-300">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Bhu-Aadhaar Cadastral Geo-Reference</span>
      </div>
    </div>
  );
};

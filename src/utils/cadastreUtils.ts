import { GeoCoordinate, LandParcel, PropertyClassification, UnitStatus } from '../types';

/**
 * Validates 14-character alphanumeric Indian ULPIN (Bhu-Aadhaar)
 * Standard format: 2-digit state code or 2-char prefix + alphanumeric parcel hash = 14 chars
 */
export function validateUlpin(ulpin: string): { isValid: boolean; message: string } {
  if (!ulpin) {
    return { isValid: false, message: 'ULPIN is required' };
  }
  const clean = ulpin.trim().toUpperCase();
  if (clean.length !== 14) {
    return { isValid: false, message: `ULPIN must be exactly 14 characters (currently ${clean.length})` };
  }
  const regex = /^[0-9A-Z]{14}$/;
  if (!regex.test(clean)) {
    return { isValid: false, message: 'ULPIN must contain only letters (A-Z) and digits (0-9)' };
  }
  return { isValid: true, message: 'Valid Bhu-Aadhaar ULPIN format' };
}

/**
 * Format currency in Indian numbering system (Lakhs and Crores)
 */
export function formatInr(priceLakhs: number): string {
  if (priceLakhs >= 100) {
    const crores = priceLakhs / 100;
    return `₹ ${crores.toFixed(2)} Cr`;
  }
  return `₹ ${priceLakhs.toFixed(2)} L`;
}

/**
 * Calculate polygon centroid from coordinates
 */
export function calculateCentroid(coordinates: GeoCoordinate[]): GeoCoordinate {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 19.076, lng: 72.8777 };
  }
  let sumLat = 0;
  let sumLng = 0;
  for (const c of coordinates) {
    sumLat += c.lat;
    sumLng += c.lng;
  }
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
}

/**
 * Calculate approximate polygon area in square meters using Haversine / spherical polygon formula
 */
export function calculatePolygonAreaSqMeters(coordinates: GeoCoordinate[]): number {
  if (!coordinates || coordinates.length < 3) return 3000;
  const radius = 6378137; // Earth's radius in meters
  let area = 0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * radius * radius) / 2.0);
  return Math.round(area);
}

/**
 * Convert lat/long boundary coordinates into localized meters relative to centroid
 * for Three.js geometry generation
 */
export function convertCoordsToLocalMeters(
  coords: GeoCoordinate[],
  center: GeoCoordinate
): { x: number; z: number }[] {
  const METERS_PER_LAT_DEG = 111320;
  const METERS_PER_LNG_DEG = 111320 * Math.cos((center.lat * Math.PI) / 180);

  return coords.map((c) => ({
    x: (c.lng - center.lng) * METERS_PER_LNG_DEG,
    z: (c.lat - center.lat) * METERS_PER_LAT_DEG,
  }));
}

/**
 * Return badge styling for classification
 */
export function getClassificationColor(classification: PropertyClassification): {
  bg: string;
  text: string;
  border: string;
} {
  switch (classification) {
    case 'commercial':
      return { bg: 'bg-blue-950/70', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'residential':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'mixed':
      return { bg: 'bg-purple-950/70', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'industrial':
      return { bg: 'bg-amber-950/70', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'agricultural':
      return { bg: 'bg-lime-950/70', text: 'text-lime-400', border: 'border-lime-500/30' };
    default:
      return { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-700' };
  }
}

export function getStatusColor(status: UnitStatus): {
  bg: string;
  text: string;
  hex: number;
} {
  switch (status) {
    case 'available':
      return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'Available', hex: 0x10b981 };
    case 'booked':
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'Reserved / Booked', hex: 0xf59e0b };
    case 'sold':
      return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', text: 'Sold Out', hex: 0xef4444 };
    default:
      return { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40', text: 'Unknown', hex: 0x64748b };
  }
}

/**
 * Generate synthetic GeoJSON from Parcel for download / export
 */
export function exportParcelAsGeoJson(parcel: LandParcel): string {
  const coordinates = [
    ...parcel.boundaries.map((b) => [b.lng, b.lat]),
    [parcel.boundaries[0].lng, parcel.boundaries[0].lat], // close polygon
  ];

  const geoJson = {
    type: 'FeatureCollection',
    name: `ULPIN_${parcel.ulpin}_Cadastre`,
    features: [
      {
        type: 'Feature',
        properties: {
          ulpin: parcel.ulpin,
          surveyNumber: parcel.surveyNumber,
          state: parcel.state,
          district: parcel.district,
          talukVillage: parcel.talukVillage,
          areaSqMeters: parcel.areaSqMeters,
          areaAcres: parcel.areaAcres,
          classification: parcel.classification,
          ownerOfRecord: parcel.ownerOfRecord,
          status: parcel.status,
          marketValuationCr: parcel.marketValuationCr,
          buildingName: parcel.building?.name || null,
          totalFloors: parcel.building?.totalFloors || 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      },
    ],
  };

  return JSON.stringify(geoJson, null, 2);
}

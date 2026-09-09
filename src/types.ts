export type PropertyClassification = 'commercial' | 'residential' | 'mixed' | 'industrial' | 'agricultural';
export type UnitStatus = 'available' | 'booked' | 'sold';
export type UlpinStatus = 'verified' | 'pending' | 'under_review';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface UnitDetail {
  id: string;
  unitNumber: string;
  type: string; // e.g. "3 BHK Luxury", "Penthouse", "Office Suite A"
  carpetAreaSqFt: number;
  superBuiltAreaSqFt: number;
  priceLakhs: number;
  status: UnitStatus;
  facing: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'South-West';
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floorPlanSvg?: string;
  furnishing: 'Unfurnished' | 'Semi-Furnished' | 'Fully-Furnished';
}

export interface FloorDetail {
  id: string;
  floorNumber: number; // 0 for Ground, 1, 2, 3...
  floorName: string; // "Ground Floor", "Level 1 - Retail", "Level 14 - Sky Residences"
  heightMeters: number;
  elevationMeters: number;
  classification: PropertyClassification;
  units: UnitDetail[];
  totalFloorAreaSqFt: number;
  floorStatusSummary?: {
    available: number;
    booked: number;
    sold: number;
  };
}

export interface BuildingDetail {
  id: string;
  name: string;
  reraNumber: string;
  architect: string;
  totalFloors: number;
  totalUnits: number;
  completionYear: number;
  footprintWidthMeters: number;
  footprintLengthMeters: number;
  floorToCeilingHeightMeters: number;
  floors: FloorDetail[];
  hasOccupancyCertificate: boolean;
  fireSafetyNoc: boolean;
}

export interface LandParcel {
  id: string;
  ulpin: string; // 14-digit Bhu-Aadhaar alphanumeric code (e.g. 14MH2345678901)
  surveyNumber: string;
  subDivision?: string;
  state: string;
  district: string;
  talukVillage: string;
  pincode: string;
  areaSqMeters: number;
  areaAcres: number;
  classification: PropertyClassification;
  status: UlpinStatus;
  ownerOfRecord: string;
  registryDate: string;
  mutationNumber: string;
  boundaries: GeoCoordinate[]; // Polygon vertices
  centerCoordinate: GeoCoordinate;
  building?: BuildingDetail;
  images: string[];
  description: string;
  marketValuationCr: number;
  zoningCode: string;
  floorSpaceIndexAllowed: number; // FSI / FAR
  fsiConsumed: number;
}

export interface ParcelFilterState {
  search: string;
  state: string;
  classification: string;
  status: string;
  minArea: number;
  maxArea: number;
  minPrice: number;
  maxPrice: number;
}

export interface EnquiryRequest {
  id?: string;
  parcelId: string;
  parcelUlpin: string;
  unitId?: string;
  unitNumber?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date?: string;
}

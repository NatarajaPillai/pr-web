import React, { useState } from 'react';
import { LandParcel, GeoCoordinate, PropertyClassification } from '../types';
import { validateUlpin, calculateCentroid, calculatePolygonAreaSqMeters } from '../utils/cadastreUtils';
import { 
  PlusCircle, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Layers, 
  Compass, 
  Sparkles,
  FileCode,
  ShieldCheck
} from 'lucide-react';

interface AdminParcelEntryProps {
  onParcelCreated: (newParcel: LandParcel) => void;
  onParcelDeleted?: (parcelId: string) => void;
  existingParcels: LandParcel[];
}

export const AdminParcelEntry: React.FC<AdminParcelEntryProps> = ({
  onParcelCreated,
  onParcelDeleted,
  existingParcels,
}) => {
  // Form State
  const [ulpin, setUlpin] = useState<string>('27MH' + Math.floor(1000000000 + Math.random() * 9000000000));
  const [surveyNumber, setSurveyNumber] = useState<string>('Plot ' + Math.floor(10 + Math.random() * 90) + ', Sector 12');
  const [state, setState] = useState<string>('Maharashtra');
  const [district, setDistrict] = useState<string>('Mumbai Suburban');
  const [talukVillage, setTalukVillage] = useState<string>('Andheri East / SEEPZ');
  const [pincode, setPincode] = useState<string>('400096');
  const [classification, setClassification] = useState<PropertyClassification>('commercial');
  const [ownerOfRecord, setOwnerOfRecord] = useState<string>('Maharashtra Industrial Dev Corp (MIDC) / Vertex Tech');
  const [marketValuationCr, setMarketValuationCr] = useState<number>(180);
  const [description, setDescription] = useState<string>('Grade-A commercial IT development with digitized Bhu-Aadhaar 3D cadastre spatial rights.');

  // Boundary coordinates
  const [baseLat, setBaseLat] = useState<number>(19.1197);
  const [baseLng, setBaseLng] = useState<number>(72.8697);
  const [boundaries, setBoundaries] = useState<GeoCoordinate[]>([
    { lat: 19.1205, lng: 72.8688 },
    { lat: 19.1209, lng: 72.8705 },
    { lat: 19.1189, lng: 72.8709 },
    { lat: 19.1185, lng: 72.8691 },
  ]);

  // Building generator config
  const [includeBuilding, setIncludeBuilding] = useState<boolean>(true);
  const [buildingName, setBuildingName] = useState<string>('Vertex Horizon Commercial Plaza');
  const [reraNumber, setReraNumber] = useState<string>('P518000' + Math.floor(10000 + Math.random() * 90000));
  const [totalFloors, setTotalFloors] = useState<number>(12);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(3);
  const [floorHeightMeters, setFloorHeightMeters] = useState<number>(3.8);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick coordinate adjustment helper
  const handleUpdateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = [...boundaries];
    updated[index][field] = num;
    setBoundaries(updated);
  };

  const handleAddVertex = () => {
    const last = boundaries[boundaries.length - 1];
    setBoundaries([...boundaries, { lat: last.lat + 0.0003, lng: last.lng + 0.0003 }]);
  };

  const handleRemoveVertex = (index: number) => {
    if (boundaries.length <= 3) {
      setErrorMessage('A polygon parcel requires at least 3 vertices.');
      return;
    }
    setBoundaries(boundaries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate ULPIN
    const validation = validateUlpin(ulpin);
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    if (boundaries.length < 3) {
      setErrorMessage('Please specify at least 3 boundary vertices.');
      return;
    }

    setIsSubmitting(true);

    try {
      const centroid = calculateCentroid(boundaries);
      const calculatedArea = calculatePolygonAreaSqMeters(boundaries);
      const acres = Math.round((calculatedArea / 4046.86) * 1000) / 1000;

      // Generate Building Floors if requested
      let buildingData = undefined;
      if (includeBuilding) {
        const floors = Array.from({ length: totalFloors }).map((_, fIdx) => {
          const isGround = fIdx === 0;
          const units = Array.from({ length: unitsPerFloor }).map((_, uIdx) => ({
            id: `u-${Date.now()}-${fIdx}-${uIdx}`,
            unitNumber: `Suite ${fIdx * 100 + uIdx + 1}`,
            type: isGround ? 'Retail / Banking Atrium' : 'Grade A Workstation Bay',
            carpetAreaSqFt: 2600 + uIdx * 400,
            superBuiltAreaSqFt: 3400 + uIdx * 500,
            priceLakhs: 850 + fIdx * 20 + uIdx * 30,
            status: fIdx < 3 ? 'sold' : fIdx % 2 === 0 ? 'available' : 'booked',
            facing: uIdx === 0 ? 'North-East' : uIdx === 1 ? 'East' : 'South',
            furnishing: 'Fully-Furnished',
          }));

          return {
            id: `fl-${Date.now()}-${fIdx}`,
            floorNumber: fIdx,
            floorName: isGround ? 'Ground Floor - Grand Lobby' : `Level ${fIdx} - Executive Suites`,
            heightMeters: floorHeightMeters,
            elevationMeters: fIdx * floorHeightMeters,
            classification,
            totalFloorAreaSqFt: 10500,
            units,
          };
        });

        buildingData = {
          id: `bld-${Date.now()}`,
          name: buildingName,
          reraNumber,
          architect: 'Buro Design Consultants',
          totalFloors,
          totalUnits: totalFloors * unitsPerFloor,
          completionYear: 2025,
          footprintWidthMeters: 40,
          footprintLengthMeters: 50,
          floorToCeilingHeightMeters: floorHeightMeters,
          hasOccupancyCertificate: true,
          fireSafetyNoc: true,
          floors,
        };
      }

      const newParcelPayload = {
        ulpin: ulpin.toUpperCase().trim(),
        surveyNumber,
        state,
        district,
        talukVillage,
        pincode,
        classification,
        status: 'verified' as const,
        ownerOfRecord,
        areaSqMeters: calculatedArea,
        areaAcres: acres,
        marketValuationCr,
        centerCoordinate: centroid,
        boundaries,
        building: buildingData,
        description,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        ],
      };

      const res = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParcelPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create parcel');
      }

      const createdParcel: LandParcel = await res.json();
      setSuccessMessage(`Parcel with ULPIN "${createdParcel.ulpin}" successfully registered and mapped in 3D!`);
      onParcelCreated(createdParcel);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving cadastral parcel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Cadastral Data Entry & 3D Spatial Registration
            </h2>
            <p className="text-xs text-slate-400">
              Input new land parcel coordinates, Bhu-Aadhaar 14-digit ULPIN code, and vertical multi-story structure.
            </p>
          </div>
        </div>

        {/* Status alerts */}
        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ULPIN & Cadastre Information */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            1. Bhu-Aadhaar Parcel Identity & Demographics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ULPIN Code (14 alphanumeric) *
              </label>
              <input
                type="text"
                maxLength={14}
                required
                value={ulpin}
                onChange={(e) => setUlpin(e.target.value.toUpperCase())}
                placeholder="27MH8899001122"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Format: 2-digit state prefix + 12 alphanumeric hash
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Survey Number *</label>
              <input
                type="text"
                required
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                placeholder="Plot C-59, G-Block"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">State Jurisdiction *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Haryana">Haryana</option>
                <option value="Telangana">Telangana</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">District *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Taluk / Village / Locality *</label>
              <input
                type="text"
                required
                value={talukVillage}
                onChange={(e) => setTalukVillage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Land Classification</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as PropertyClassification)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="commercial">Commercial Hub</option>
                <option value="residential">Residential High-Rise</option>
                <option value="mixed">Mixed-Use Transit Hub</option>
                <option value="industrial">Industrial SEZ</option>
                <option value="agricultural">Agricultural / Conversion</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Owner of Record / Authority</label>
              <input
                type="text"
                value={ownerOfRecord}
                onChange={(e) => setOwnerOfRecord(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Market Valuation (₹ Cr)</label>
              <input
                type="number"
                step="0.5"
                value={marketValuationCr}
                onChange={(e) => setMarketValuationCr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Boundary Polygon Coordinates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              2. Lat/Long Boundary Coordinates (Polygon Vertices)
            </h3>
            <button
              type="button"
              onClick={handleAddVertex}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Boundary Stone
            </button>
          </div>

          <div className="space-y-2">
            {boundaries.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs"
              >
                <span className="w-7 h-7 rounded-full bg-slate-800 font-mono font-bold text-amber-300 flex items-center justify-center shrink-0">
                  P{idx + 1}
                </span>

                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={pt.lat}
                      onChange={(e) => handleUpdateCoordinate(idx, 'lat', e.target.value)}
                      className="w-full bg-transparent text-slate-200 font-mono focus:outline-none border-b border-slate-800 focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={pt.lng}
                      onChange={(e) => handleUpdateCoordinate(idx, 'lng', e.target.value)}
                      className="w-full bg-transparent text-slate-200 font-mono focus:outline-none border-b border-slate-800 focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveVertex(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove vertex"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Vertical Building Mapping */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              3. Vertical Property Mapping (Multi-Story Footprint)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={includeBuilding}
                onChange={(e) => setIncludeBuilding(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span>Generate 3D Vertical Tower</span>
            </label>
          </div>

          {includeBuilding && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Building / Tower Name</label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">RERA Registration ID</label>
                <input
                  type="text"
                  value={reraNumber}
                  onChange={(e) => setReraNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Number of Stories / Floors</label>
                <input
                  type="number"
                  min="2"
                  max="35"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Units Per Floor</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={unitsPerFloor}
                  onChange={(e) => setUnitsPerFloor(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Floor-to-Ceiling Height (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.8"
                  max="5.0"
                  value={floorHeightMeters}
                  onChange={(e) => setFloorHeightMeters(parseFloat(e.target.value) || 3.5)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Registering Cadastral 3D Model...' : 'Register Parcel & Generate 3D Map'}
          </button>
        </div>
      </form>
    </div>
  );
};

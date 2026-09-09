import React, { useState } from 'react';
import { FloorDetail, LandParcel, UnitDetail } from '../types';
import { formatInr, getStatusColor } from '../utils/cadastreUtils';
import { 
  X, 
  Building, 
  Compass, 
  Maximize, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileText, 
  Send, 
  Sparkles, 
  Check, 
  BedDouble, 
  Bath, 
  Layers
} from 'lucide-react';

interface UnitDetailPanelProps {
  parcel: LandParcel;
  selectedFloor: FloorDetail | null;
  selectedUnit: UnitDetail | null;
  onSelectFloor: (floor: FloorDetail | null) => void;
  onSelectUnit: (unit: UnitDetail | null) => void;
  onClose: () => void;
  onOpenEnquiry: (unit?: UnitDetail) => void;
  onUnitStatusUpdated?: (unitId: string, status: 'available' | 'booked' | 'sold') => void;
}

export const UnitDetailPanel: React.FC<UnitDetailPanelProps> = ({
  parcel,
  selectedFloor,
  selectedUnit,
  onSelectFloor,
  onSelectUnit,
  onClose,
  onOpenEnquiry,
  onUnitStatusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'floorplan' | 'units'>('overview');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  if (!selectedFloor) return null;

  const currentUnit = selectedUnit || selectedFloor.units[0];

  const handleBookUnit = async (unit: UnitDetail) => {
    if (unit.status !== 'available') return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/parcels/${parcel.id}/units/${unit.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'booked' }),
      });
      if (res.ok) {
        setBookingSuccess(`Unit ${unit.unitNumber} reserved successfully! Our relationship manager will contact you.`);
        unit.status = 'booked';
        if (onUnitStatusUpdated) {
          onUnitStatusUpdated(unit.id, 'booked');
        }
      }
    } catch (err) {
      console.error('Failed to book unit', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="w-full lg:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-start justify-between bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Floor {selectedFloor.floorNumber}
            </span>
            <span className="text-xs text-slate-400">
              +{selectedFloor.elevationMeters.toFixed(1)}m elevation
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 mt-1 line-clamp-1">
            {selectedFloor.floorName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 font-medium text-center border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Unit Specs
        </button>
        <button
          onClick={() => setActiveTab('floorplan')}
          className={`flex-1 py-2.5 font-medium text-center border-b-2 transition-colors ${
            activeTab === 'floorplan'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2D Floor Plan
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 py-2.5 font-medium text-center border-b-2 transition-colors ${
            activeTab === 'units'
              ? 'border-amber-400 text-amber-300 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Floor Units ({selectedFloor.units.length})
        </button>
      </div>

      {/* Booking notification message */}
      {bookingSuccess && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Body */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {activeTab === 'overview' && currentUnit && (
          <div className="space-y-4">
            {/* Unit Header Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-mono text-slate-400">Unit ID</span>
                  <div className="text-base font-bold text-slate-100">{currentUnit.unitNumber}</div>
                </div>
                {/* Status Pill */}
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                    getStatusColor(currentUnit.status).bg
                  }`}
                >
                  {getStatusColor(currentUnit.status).text}
                </span>
              </div>
              <div className="text-xs text-amber-300/90 font-medium">{currentUnit.type}</div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Listed Price</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {formatInr(currentUnit.priceLakhs)}
                </span>
              </div>
            </div>

            {/* Dimensional Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Carpet Area (RERA)</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  {currentUnit.carpetAreaSqFt.toLocaleString()} sq.ft
                </div>
                <div className="text-[10px] text-slate-500">
                  ~{(currentUnit.carpetAreaSqFt * 0.0929).toFixed(1)} sq.m
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Super Built-Up Area</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  {currentUnit.superBuiltAreaSqFt.toLocaleString()} sq.ft
                </div>
                <div className="text-[10px] text-slate-500">Efficiency ~78%</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Direction / Facing</div>
                <div className="text-sm font-semibold text-sky-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  {currentUnit.facing}
                </div>
                <div className="text-[10px] text-slate-500">Vastu Compliant</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Furnishing Status</div>
                <div className="text-sm font-semibold text-slate-200">
                  {currentUnit.furnishing}
                </div>
                <div className="text-[10px] text-slate-500">Ready to Fit</div>
              </div>
            </div>

            {/* Residential specifics if bedrooms exist */}
            {currentUnit.bedrooms && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <BedDouble className="w-4 h-4 text-amber-400" />
                  <span>{currentUnit.bedrooms} Beds</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Bath className="w-4 h-4 text-sky-400" />
                  <span>{currentUnit.bathrooms} Baths</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Maximize className="w-4 h-4 text-emerald-400" />
                  <span>{currentUnit.balconies} Balconies</span>
                </div>
              </div>
            )}

            {/* Cadastral & RERA Verification Badges */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RERA Registration</span>
                <span className="font-mono text-amber-400 font-medium">
                  {parcel.building?.reraNumber || 'PRM/KA/RERA/2024'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Occupancy Certificate (OC)</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Linked ULPIN Cadastre</span>
                <span className="font-mono text-slate-300">{parcel.ulpin}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {currentUnit.status === 'available' ? (
                <button
                  id="btn-reserve-unit"
                  onClick={() => handleBookUnit(currentUnit)}
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {isUpdatingStatus ? 'Processing Hold...' : 'Reserve This Unit (Hold for 7 Days)'}
                </button>
              ) : (
                <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-center font-medium text-xs">
                  {currentUnit.status === 'booked' ? 'Unit is Currently on Hold' : 'Unit Already Sold'}
                </div>
              )}

              <button
                id="btn-schedule-inspection"
                onClick={() => onOpenEnquiry(currentUnit)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                Schedule Physical Site Inspection
              </button>
            </div>
          </div>
        )}

        {/* 2D Floor Plan SVG Tab */}
        {activeTab === 'floorplan' && currentUnit && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Schematic Blueprint Layout</span>
              <span className="font-mono text-amber-300">{currentUnit.unitNumber}</span>
            </div>

            {/* SVG Floor Plan Diagram */}
            <div className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800 p-3 flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 400 300" className="w-full h-full stroke-slate-600">
                {/* Outer Wall Boundary */}
                <rect x="20" y="20" width="360" height="260" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" rx="4" />

                {/* Living / Primary Space */}
                <rect x="25" y="25" width="220" height="150" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="135" y="95" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">
                  {parcel.classification === 'commercial' ? 'Main Workstation Bay' : 'Living & Dining Lounge'}
                </text>
                <text x="135" y="115" fill="#64748b" fontSize="10" textAnchor="middle">
                  {Math.round(currentUnit.carpetAreaSqFt * 0.45)} sq.ft
                </text>

                {/* Master Chamber / Executive Suite */}
                <rect x="250" y="25" width="125" height="150" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="312" y="95" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
                  {parcel.classification === 'commercial' ? 'Executive Cabin' : 'Master Suite'}
                </text>
                <text x="312" y="115" fill="#64748b" fontSize="9" textAnchor="middle">
                  {Math.round(currentUnit.carpetAreaSqFt * 0.28)} sq.ft
                </text>

                {/* Conference Room / Bedroom 2 */}
                <rect x="25" y="180" width="180" height="100" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="115" y="235" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
                  {parcel.classification === 'commercial' ? 'Conference Pod' : 'Suite 2 / Guest'}
                </text>

                {/* Pantry / Kitchenette / Bath */}
                <rect x="210" y="180" width="165" height="100" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="292" y="235" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
                  {parcel.classification === 'commercial' ? 'Pantry & Restrooms' : 'Modular Kitchen & Bath'}
                </text>

                {/* Balcony / Deck */}
                <rect x="25" y="25" width="220" height="20" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeDasharray="4,4" />
                <text x="135" y="38" fill="#38bdf8" fontSize="9" textAnchor="middle">
                  Panoramic Viewing Deck
                </text>

                {/* Door Arc */}
                <path d="M 245 140 A 20 20 0 0 0 245 160" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              </svg>

              <div className="absolute top-3 right-3 text-[10px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-mono">
                CAD Scale: 1:100
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              Architectural CAD drawing compliant with Indian National Building Code (NBC 2016) and vertical 3D cadastre titling norms.
            </div>
          </div>
        )}

        {/* Units List Tab */}
        {activeTab === 'units' && (
          <div className="space-y-2">
            {selectedFloor.units.map((unit) => {
              const isSelected = unit.id === currentUnit.id;
              const statusCfg = getStatusColor(unit.status);

              return (
                <div
                  key={unit.id}
                  onClick={() => onSelectUnit(unit)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-100">{unit.unitNumber}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${statusCfg.bg}`}>
                      {statusCfg.text}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{unit.type}</div>
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 font-mono">{unit.carpetAreaSqFt} sq.ft</span>
                    <span className="font-bold text-amber-300 font-mono">{formatInr(unit.priceLakhs)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Floor {selectedFloor.floorNumber} Total: {selectedFloor.totalFloorAreaSqFt.toLocaleString()} sq.ft</span>
        </span>
        <span className="font-mono text-slate-400">NBC Approved</span>
      </div>
    </div>
  );
};

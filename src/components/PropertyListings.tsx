import React, { useState, useMemo } from 'react';
import { LandParcel } from '../types';
import { formatInr, getClassificationColor } from '../utils/cadastreUtils';
import { 
  Building2, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  Eye, 
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  ChevronDown
} from 'lucide-react';

interface PropertyListingsProps {
  parcels: LandParcel[];
  onSelectParcel: (parcel: LandParcel) => void;
  onNavigateToViewer: (parcel: LandParcel) => void;
}

export const PropertyListings: React.FC<PropertyListingsProps> = ({
  parcels,
  onSelectParcel,
  onNavigateToViewer,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(500);

  // Extract unique states
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(parcels.map((p) => p.state))).sort();
  }, [parcels]);

  // Filtered parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      const matchSearch =
        searchTerm === '' ||
        p.ulpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.talukVillage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.building && p.building.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchState = selectedState === 'all' || p.state === selectedState;
      const matchClassification = selectedClassification === 'all' || p.classification === selectedClassification;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchPrice = p.marketValuationCr <= maxPrice;

      return matchSearch && matchState && matchClassification && matchStatus && matchPrice;
    });
  }, [parcels, searchTerm, selectedState, selectedClassification, selectedStatus, maxPrice]);

  return (
    <div className="w-full space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>National Cadastral Land & Vertical Registry</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Browse geo-verified Indian land parcels with digitized 3D vertical spatial rights.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ULPIN, Survey, City..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs">
          {/* State Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">State Jurisdiction</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All States & Territories</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Zoning / Usage</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Property Classes</option>
              <option value="commercial">Commercial Hub</option>
              <option value="residential">Residential High-Rise</option>
              <option value="mixed">Mixed-Use Transit</option>
              <option value="industrial">Industrial SEZ</option>
            </select>
          </div>

          {/* ULPIN Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Cadastral Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified (Bhu-Aadhaar)</option>
              <option value="under_review">Under Review / Mutation</option>
              <option value="pending">Survey Pending</option>
            </select>
          </div>

          {/* Max Price Range Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Max Valuation</span>
              <span className="font-mono text-amber-300">₹ {maxPrice} Cr</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Results Count & Active Tags */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{filteredParcels.length}</strong> land parcel properties
        </span>
        {(searchTerm || selectedState !== 'all' || selectedClassification !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedState('all');
              setSelectedClassification('all');
              setSelectedStatus('all');
              setMaxPrice(500);
            }}
            className="text-amber-400 hover:underline"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Grid of Property Cards */}
      {filteredParcels.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No matching cadastral records found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or clear the filters to view available land parcels across Indian metro corridors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParcels.map((parcel) => {
            const classColor = getClassificationColor(parcel.classification);

            return (
              <div
                key={parcel.id}
                className="group bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Property Image Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={parcel.images[0]}
                      alt={parcel.building?.name || parcel.surveyNumber}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    {/* ULPIN Badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {parcel.ulpin}
                      </span>
                    </div>

                    {/* Classification Tag */}
                    <div
                      className={`absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${classColor.bg} ${classColor.text} ${classColor.border}`}
                    >
                      {parcel.classification}
                    </div>

                    {/* Valuation Pill */}
                    <div className="absolute bottom-3 left-3 flex items-baseline gap-1">
                      <span className="text-xs text-slate-300">Valuation:</span>
                      <span className="text-base font-bold font-mono text-white">
                        ₹ {parcel.marketValuationCr.toFixed(1)} Cr
                      </span>
                    </div>

                    {/* 3D Model Badge */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded-md backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>3D Model Ready</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                        {parcel.building ? parcel.building.name : parcel.surveyNumber}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="line-clamp-1">
                          {parcel.talukVillage}, {parcel.district}, {parcel.state}
                        </span>
                      </div>
                    </div>

                    {/* Quick Specs Pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-500">Parcel Land Area</div>
                        <div className="font-semibold text-slate-200 font-mono">
                          {parcel.areaSqMeters.toLocaleString()} m² ({parcel.areaAcres} ac)
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Vertical Structure</div>
                        <div className="font-semibold text-slate-200">
                          {parcel.building
                            ? `${parcel.building.totalFloors} Floors • ${parcel.building.totalUnits} Units`
                            : 'Open Parcel (Unbuilt)'}
                        </div>
                      </div>
                    </div>

                    {/* Owner of Record snippet */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        Owner: <strong className="text-slate-300">{parcel.ownerOfRecord}</strong>
                      </span>
                      <span className="font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {parcel.status === 'verified' ? 'Verified' : 'Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-4 pt-0">
                  <button
                    id={`btn-open-3d-${parcel.id}`}
                    onClick={() => {
                      onSelectParcel(parcel);
                      onNavigateToViewer(parcel);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all group/btn shadow-md border border-slate-700 hover:border-amber-400"
                  >
                    <Eye className="w-4 h-4 text-amber-400 group-hover/btn:text-slate-950" />
                    <span>Launch Interactive 3D Viewer</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

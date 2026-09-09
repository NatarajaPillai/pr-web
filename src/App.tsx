import React, { useState, useEffect } from 'react';
import { LandParcel, FloorDetail, UnitDetail } from './types';
import { INITIAL_PARCELS } from './data/mockParcels';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { ThreePropertyViewer } from './components/ThreePropertyViewer';
import { CadastralMap } from './components/CadastralMap';
import { UnitDetailPanel } from './components/UnitDetailPanel';
import { UlpinSearchBar } from './components/UlpinSearchBar';
import { PropertyListings } from './components/PropertyListings';
import { AdminParcelEntry } from './components/AdminParcelEntry';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { EnquiryModal } from './components/EnquiryModal';
import { Footer } from './components/Footer';
import { exportParcelAsGeoJson, formatInr, getClassificationColor } from './utils/cadastreUtils';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Compass, 
  Download, 
  ShieldCheck, 
  Maximize2, 
  ChevronRight, 
  FileText, 
  ExternalLink,
  Info,
  Sliders,
  Map,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  const [parcels, setParcels] = useState<LandParcel[]>(INITIAL_PARCELS);
  const [selectedParcel, setSelectedParcel] = useState<LandParcel>(INITIAL_PARCELS[0]);
  const [viewMode, setViewMode] = useState<'land' | 'vertical' | 'exploded'>('vertical');
  const [displayMode, setDisplayMode] = useState<'3d' | 'map' | 'split'>('3d');
  const [selectedFloor, setSelectedFloor] = useState<FloorDetail | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'viewer' | 'listings' | 'services' | 'about' | 'admin'>('home');
  
  // Modals & Dialogs
  const [enquiryModalOpen, setEnquiryModalOpen] = useState<boolean>(false);
  const [enquiryTargetUnit, setEnquiryTargetUnit] = useState<UnitDetail | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch live parcels from Express API
  useEffect(() => {
    fetch('/api/parcels')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data: LandParcel[]) => {
        if (data && data.length) {
          setParcels(data);
          // Default to first parcel
          if (!selectedParcel) {
            setSelectedParcel(data[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Using seeded parcels fallback', err);
      });
  }, []);

  // Search by ULPIN or query
  const handleSearchUlpin = async (query: string) => {
    if (!query.trim()) {
      setSearchError(null);
      return;
    }
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/parcels/lookup/${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        // Try fuzzy client filter
        const found = parcels.find(
          (p) =>
            p.ulpin.toLowerCase().includes(query.toLowerCase()) ||
            p.surveyNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.talukVillage.toLowerCase().includes(query.toLowerCase()) ||
            (p.building && p.building.name.toLowerCase().includes(query.toLowerCase()))
        );

        if (found) {
          setSelectedParcel(found);
          setSelectedFloor(null);
          setSelectedUnit(null);
          setActiveTab('viewer');
          return;
        }

        throw new Error(`Land record with ULPIN "${query}" was not found in the national registry.`);
      }

      const parcel: LandParcel = await res.json();
      setSelectedParcel(parcel);
      setSelectedFloor(null);
      setSelectedUnit(null);
      setActiveTab('viewer');
    } catch (err: any) {
      setSearchError(err.message || 'Parcel lookup failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Upload GeoJSON handler
  const handleUploadGeoJson = (geoJson: any) => {
    try {
      const feature = geoJson.features ? geoJson.features[0] : geoJson;
      const coords = feature.geometry.coordinates[0];
      const boundaries = coords.map((pt: [number, number]) => ({ lng: pt[0], lat: pt[1] }));
      
      const newCustomParcel: LandParcel = {
        id: `custom-geojson-${Date.now()}`,
        ulpin: '99CUSTOM' + Math.floor(100000 + Math.random() * 900000),
        surveyNumber: feature.properties?.surveyNumber || 'Imported GeoJSON Boundary',
        state: feature.properties?.state || 'National Territory',
        district: feature.properties?.district || 'Survey Sector',
        talukVillage: feature.properties?.talukVillage || 'Survey Polygon',
        pincode: '000000',
        areaSqMeters: 4500,
        areaAcres: 1.11,
        classification: 'commercial',
        status: 'verified',
        ownerOfRecord: feature.properties?.ownerOfRecord || 'Private Registry Stakeholder',
        registryDate: new Date().toISOString().split('T')[0],
        mutationNumber: `MUT-GEO-${Date.now().toString().slice(-4)}`,
        centerCoordinate: boundaries[0],
        boundaries,
        marketValuationCr: 95.0,
        zoningCode: 'Imported Spatial Polygon',
        floorSpaceIndexAllowed: 3.5,
        fsiConsumed: 2.9,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        ],
        description: 'Custom imported cadastral parcel polygon from external GeoJSON coordinate survey.',
        building: {
          id: `bld-custom-${Date.now()}`,
          name: 'Imported Parcel 3D Structure',
          reraNumber: 'P51800099999',
          architect: 'Spatial Geo Engine',
          totalFloors: 8,
          totalUnits: 24,
          completionYear: 2025,
          footprintWidthMeters: 40,
          footprintLengthMeters: 48,
          floorToCeilingHeightMeters: 3.6,
          hasOccupancyCertificate: true,
          fireSafetyNoc: true,
          floors: Array.from({ length: 8 }).map((_, fIdx) => ({
            id: `fl-custom-${fIdx}`,
            floorNumber: fIdx,
            floorName: fIdx === 0 ? 'Ground Concourse' : `Floor ${fIdx} - Executive Suites`,
            heightMeters: 3.6,
            elevationMeters: fIdx * 3.6,
            classification: 'commercial',
            totalFloorAreaSqFt: 9200,
            units: [
              {
                id: `u-c-${fIdx}-1`,
                unitNumber: `Suite ${fIdx * 100 + 1}`,
                type: 'Executive Workspace',
                carpetAreaSqFt: 2800,
                superBuiltAreaSqFt: 3600,
                priceLakhs: 750 + fIdx * 25,
                status: 'available',
                facing: 'North-East',
                furnishing: 'Fully-Furnished',
              },
            ] as any,
          })),
        },
      };

      setParcels((prev) => [newCustomParcel, ...prev]);
      setSelectedParcel(newCustomParcel);
      setActiveTab('viewer');
    } catch (err) {
      setSearchError('Could not parse geometry coordinates from GeoJSON.');
    }
  };

  // Download GeoJSON
  const handleDownloadGeoJson = () => {
    if (!selectedParcel) return;
    const geoJsonStr = exportParcelAsGeoJson(selectedParcel);
    const blob = new Blob([geoJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ULPIN_${selectedParcel.ulpin}_Cadastre.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Unit status update callback
  const handleUnitStatusUpdated = (unitId: string, status: 'available' | 'booked' | 'sold') => {
    setParcels((prevParcels) =>
      prevParcels.map((p) => {
        if (p.id !== selectedParcel.id || !p.building) return p;
        const updatedFloors = p.building.floors.map((f) => ({
          ...f,
          units: f.units.map((u) => (u.id === unitId ? { ...u, status } : u)),
        }));
        return {
          ...p,
          building: {
            ...p.building,
            floors: updatedFloors,
          },
        };
      })
    );
  };

  const classColor = getClassificationColor(selectedParcel.classification);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenQuickSearch={() => setActiveTab('viewer')}
        onOpenEnquiry={() => {
          setEnquiryTargetUnit(null);
          setEnquiryModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB 1: HOME LANDING PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            <LandingHero
              featuredParcel={selectedParcel}
              onExploreClick={() => setActiveTab('viewer')}
              onOpenViewer={(parcel) => {
                setSelectedParcel(parcel);
                setActiveTab('viewer');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* Quick ULPIN Search Section on Homepage */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                    Instant Land Parcel Lookup
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Inspect Any Indian Cadastral Parcel in 3D
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Type a 14-digit ULPIN or pick an iconic metro corridor below to generate its 3D polygon and vertical floors:
                  </p>
                </div>

                <UlpinSearchBar
                  allParcels={parcels}
                  onSearch={handleSearchUlpin}
                  onSelectParcel={(parcel) => {
                    setSelectedParcel(parcel);
                    setActiveTab('viewer');
                  }}
                  onUploadGeoJson={handleUploadGeoJson}
                  isLoading={isSearching}
                />

                {searchError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs text-center">
                    {searchError}
                  </div>
                )}
              </div>
            </div>

            {/* Featured Listings Preview */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Prime 3D Cadastral Properties</h3>
                  <p className="text-xs text-slate-400">
                    High-density commercial hubs, luxury residential towers, and transit nodes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('listings')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <span>View All Registry Listings</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <PropertyListings
                parcels={parcels.slice(0, 3)}
                onSelectParcel={(p) => setSelectedParcel(p)}
                onNavigateToViewer={(p) => {
                  setSelectedParcel(p);
                  setActiveTab('viewer');
                }}
              />
            </div>

            {/* Services & About sections */}
            <ServicesSection onNavigateToViewer={() => setActiveTab('viewer')} />
            <AboutSection />
          </div>
        )}

        {/* TAB 2: INTERACTIVE 3D CADASTRE VIEWER */}
        {activeTab === 'viewer' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Top Toolbar: Search Bar + Sample Chips */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
              <UlpinSearchBar
                allParcels={parcels}
                onSearch={handleSearchUlpin}
                onSelectParcel={(parcel) => {
                  setSelectedParcel(parcel);
                  setSelectedFloor(null);
                  setSelectedUnit(null);
                }}
                onUploadGeoJson={handleUploadGeoJson}
                isLoading={isSearching}
              />
              {searchError && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs text-center">
                  {searchError}
                </div>
              )}
            </div>

            {/* Display Mode Bar: 3D Only / 2D Map / Split View */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{selectedParcel.building ? selectedParcel.building.name : selectedParcel.surveyNumber}</span>
                </span>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${classColor.bg} ${classColor.text} ${classColor.border}`}>
                  {selectedParcel.classification}
                </span>
              </div>

              {/* View switch tabs (3D Canvas / 2D Cadastre Map / Split Mode) */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                <button
                  id="btn-display-3d"
                  onClick={() => setDisplayMode('3d')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    displayMode === '3d'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Interactive 3D
                </button>

                <button
                  id="btn-display-split"
                  onClick={() => setDisplayMode('split')}
                  className={`hidden sm:block px-3 py-1.5 rounded-lg font-medium transition-all ${
                    displayMode === 'split'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Split (3D + 2D Map)
                </button>

                <button
                  id="btn-display-map"
                  onClick={() => setDisplayMode('map')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    displayMode === 'map'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2D Cadastral Map
                </button>
              </div>
            </div>

            {/* Main Stage Grid: 3D Canvas / Map + Inspection Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Center Canvas / Map Column */}
              <div className={`${selectedFloor ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} transition-all space-y-4`}>
                <div className="h-[560px] sm:h-[640px] w-full">
                  {displayMode === '3d' && (
                    <ThreePropertyViewer
                      parcel={selectedParcel}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      selectedFloor={selectedFloor}
                      selectedUnit={selectedUnit}
                      onSelectFloor={setSelectedFloor}
                      onSelectUnit={(unit, floor) => {
                        setSelectedFloor(floor);
                        setSelectedUnit(unit);
                      }}
                      className="h-full"
                    />
                  )}

                  {displayMode === 'map' && (
                    <CadastralMap parcel={selectedParcel} className="h-full" />
                  )}

                  {displayMode === 'split' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                      <ThreePropertyViewer
                        parcel={selectedParcel}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        selectedFloor={selectedFloor}
                        selectedUnit={selectedUnit}
                        onSelectFloor={setSelectedFloor}
                        onSelectUnit={(unit, floor) => {
                          setSelectedFloor(floor);
                          setSelectedUnit(unit);
                        }}
                        className="h-full"
                      />
                      <CadastralMap parcel={selectedParcel} className="h-full" />
                    </div>
                  )}
                </div>

                {/* Parcel Metadata Dossier Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300">
                          ULPIN: {selectedParcel.ulpin}
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Bhu-Aadhaar Verified
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        Survey {selectedParcel.surveyNumber} • {selectedParcel.talukVillage}, {selectedParcel.district}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadGeoJson}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        title="Download standard GeoJSON polygon boundary"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Export GeoJSON</span>
                      </button>

                      <button
                        onClick={() => {
                          setEnquiryTargetUnit(null);
                          setEnquiryModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        <span>Request Deed Audit</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">Land Parcel Area</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">
                        {selectedParcel.areaSqMeters.toLocaleString()} m²
                      </div>
                      <div className="text-[10px] text-slate-400">{selectedParcel.areaAcres} Acres</div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">Market Valuation</div>
                      <div className="font-mono font-bold text-amber-400 mt-0.5">
                        ₹ {selectedParcel.marketValuationCr.toFixed(1)} Cr
                      </div>
                      <div className="text-[10px] text-slate-400">Circle Rate Aligned</div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">FAR / FSI Index</div>
                      <div className="font-mono font-bold text-sky-400 mt-0.5">
                        {selectedParcel.fsiConsumed} / {selectedParcel.floorSpaceIndexAllowed}
                      </div>
                      <div className="text-[10px] text-slate-400">Permissible Limit</div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">Mutation Number</div>
                      <div className="font-mono font-semibold text-slate-300 mt-0.5 truncate">
                        {selectedParcel.mutationNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">Reg: {selectedParcel.registryDate}</div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">Centroid Coords</div>
                      <div className="font-mono text-slate-300 mt-0.5 truncate text-[11px]">
                        {selectedParcel.centerCoordinate.lat.toFixed(4)}, {selectedParcel.centerCoordinate.lng.toFixed(4)}
                      </div>
                      <div className="text-[10px] text-slate-400">WGS-84 Datum</div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-medium">Owner of Record</div>
                      <div className="font-medium text-slate-300 mt-0.5 truncate">
                        {selectedParcel.ownerOfRecord}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Title Clear</div>
                    </div>
                  </div>

                  {/* Parcel Description */}
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {selectedParcel.description}
                  </p>
                </div>
              </div>

              {/* Right Side-Drawer: Floor & Unit Detailed Specs (When floor or unit is clicked/selected) */}
              {selectedFloor && (
                <div className="lg:col-span-4 xl:col-span-3 sticky top-24">
                  <UnitDetailPanel
                    parcel={selectedParcel}
                    selectedFloor={selectedFloor}
                    selectedUnit={selectedUnit}
                    onSelectFloor={setSelectedFloor}
                    onSelectUnit={setSelectedUnit}
                    onClose={() => {
                      setSelectedFloor(null);
                      setSelectedUnit(null);
                    }}
                    onOpenEnquiry={(unit) => {
                      setEnquiryTargetUnit(unit || null);
                      setEnquiryModalOpen(true);
                    }}
                    onUnitStatusUpdated={handleUnitStatusUpdated}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: NATIONAL LAND REGISTRY LISTINGS */}
        {activeTab === 'listings' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <PropertyListings
              parcels={parcels}
              onSelectParcel={(p) => setSelectedParcel(p)}
              onNavigateToViewer={(p) => {
                setSelectedParcel(p);
                setActiveTab('viewer');
              }}
            />
          </div>
        )}

        {/* TAB 4: SERVICES */}
        {activeTab === 'services' && (
          <ServicesSection onNavigateToViewer={() => setActiveTab('viewer')} />
        )}

        {/* TAB 5: ABOUT ULPIN */}
        {activeTab === 'about' && <AboutSection />}

        {/* TAB 6: ADMIN STUDIO */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <AdminParcelEntry
              existingParcels={parcels}
              onParcelCreated={(newParcel) => {
                setParcels((prev) => [newParcel, ...prev]);
                setSelectedParcel(newParcel);
                setActiveTab('viewer');
              }}
            />
          </div>
        )}
      </main>

      {/* Enquiry / Inspection Booking Modal */}
      {enquiryModalOpen && (
        <EnquiryModal
          parcel={selectedParcel}
          unit={enquiryTargetUnit}
          onClose={() => setEnquiryModalOpen(false)}
        />
      )}

      {/* Footer */}
      <Footer onSelectTab={(tab) => setActiveTab(tab)} />
    </div>
  );
}

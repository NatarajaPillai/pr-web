import React, { useState } from 'react';
import { Search, MapPin, Sparkles, AlertCircle, Upload, CheckCircle2, ChevronRight, FileCode } from 'lucide-react';
import { validateUlpin } from '../utils/cadastreUtils';
import { LandParcel } from '../types';

interface UlpinSearchBarProps {
  onSearch: (query: string) => void;
  onSelectParcel: (parcel: LandParcel) => void;
  allParcels: LandParcel[];
  isLoading?: boolean;
  onUploadGeoJson?: (geoJson: any) => void;
}

const SAMPLE_ULPINS = [
  { label: 'Mumbai BKC Financial', ulpin: '27MH8899001122', city: 'Mumbai, MH' },
  { label: 'Gurugram Golf Course', ulpin: '06HR4433221100', city: 'Gurugram, HR' },
  { label: 'Bengaluru Tech Matrix', ulpin: '29KA7766554433', city: 'Bengaluru, KA' },
  { label: 'Hyderabad HITEC Tower', ulpin: '36TS9911223344', city: 'Hyderabad, TS' },
  { label: 'Gujarat GIFT IFSC', ulpin: '24GJ1234567890', city: 'Gandhinagar, GJ' },
  { label: 'Delhi Barakhamba', ulpin: '07DL6655443322', city: 'New Delhi, DL' },
];

export const UlpinSearchBar: React.FC<UlpinSearchBarProps> = ({
  onSearch,
  onSelectParcel,
  allParcels,
  isLoading = false,
  onUploadGeoJson,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGeoJsonModal, setShowGeoJsonModal] = useState<boolean>(false);
  const [geoJsonText, setGeoJsonText] = useState<string>('');

  const handleExecuteSearch = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      onSearch('');
      setErrorMessage(null);
      return;
    }

    // Check if it's a 14-char ULPIN attempt
    if (trimmed.length === 14 && /^[0-9A-Za-z]+$/.test(trimmed)) {
      const validation = validateUlpin(trimmed);
      if (!validation.isValid) {
        setErrorMessage(validation.message);
        return;
      }
    }

    setErrorMessage(null);
    onSearch(trimmed);
  };

  const handleSelectSample = (sampleUlpin: string) => {
    setInputVal(sampleUlpin);
    setErrorMessage(null);
    const matched = allParcels.find((p) => p.ulpin.toUpperCase() === sampleUlpin.toUpperCase());
    if (matched) {
      onSelectParcel(matched);
    } else {
      onSearch(sampleUlpin);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (onUploadGeoJson) {
          onUploadGeoJson(json);
          setShowGeoJsonModal(false);
        }
      } catch (err) {
        setErrorMessage('Invalid GeoJSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleManualGeoJsonSubmit = () => {
    try {
      const parsed = JSON.parse(geoJsonText);
      if (onUploadGeoJson) {
        onUploadGeoJson(parsed);
        setShowGeoJsonModal(false);
      }
    } catch (err) {
      setErrorMessage('Failed to parse GeoJSON text.');
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Main Search Input Form */}
      <div className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-xl p-1.5 focus-within:border-amber-500/80 transition-all">
        <div className="pl-3.5 pr-2 text-slate-400">
          <Search className="w-5 h-5 text-amber-400" />
        </div>

        <input
          id="input-ulpin-search"
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleExecuteSearch(inputVal);
          }}
          placeholder="Enter 14-digit ULPIN (e.g. 27MH8899001122), Survey Number, or Project Name..."
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none py-2.5 px-2 font-mono"
        />

        <div className="flex items-center gap-2 pr-1.5">
          {/* GeoJSON Upload trigger */}
          <button
            id="btn-open-geojson"
            onClick={() => setShowGeoJsonModal(true)}
            title="Import GeoJSON Parcel Boundary"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700/80 transition-colors border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>

          {/* Search Button */}
          <button
            id="btn-execute-search"
            onClick={() => handleExecuteSearch(inputVal)}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Search Cadastre</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error / Validation warning banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Sample ULPIN Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Sample Bhu-Aadhaar Parcels:
        </span>
        {SAMPLE_ULPINS.map((item) => (
          <button
            key={item.ulpin}
            onClick={() => handleSelectSample(item.ulpin)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-amber-300 text-[11px] font-mono flex items-center gap-1.5 transition-all hover:border-amber-500/40"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">{item.label}</span>
            <span className="text-slate-500 text-[10px]">({item.city})</span>
          </button>
        ))}
      </div>

      {/* GeoJSON Fallback Modal */}
      {showGeoJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Upload GeoJSON Parcel Boundary</h3>
              </div>
              <button
                onClick={() => setShowGeoJsonModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide standard GeoJSON Polygon Feature coordinates to generate custom 3D parcel extrusion and vertical footprint:
            </p>

            {/* Drag and Drop File Input */}
            <label className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
              <Upload className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                Click to browse or drop .geojson file
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Supports standard Polygon / MultiPolygon</span>
              <input
                type="file"
                accept=".json,.geojson"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-mono">
                or paste raw JSON
              </span>
            </div>

            <textarea
              rows={4}
              value={geoJsonText}
              onChange={(e) => setGeoJsonText(e.target.value)}
              placeholder='{ "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [[[72.86, 19.06], ...]] } }'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowGeoJsonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleManualGeoJsonSubmit}
                disabled={!geoJsonText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
              >
                Import Geometry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

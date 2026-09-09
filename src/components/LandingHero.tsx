import React from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Globe2, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';
import { LandParcel } from '../types';

interface LandingHeroProps {
  featuredParcel: LandParcel;
  onExploreClick: () => void;
  onOpenViewer: (parcel: LandParcel) => void;
  onNavigateTab: (tab: 'viewer' | 'listings' | 'admin' | 'services' | 'about') => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  featuredParcel,
  onExploreClick,
  onOpenViewer,
  onNavigateTab,
}) => {
  return (
    <div className="relative overflow-hidden py-10 md:py-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* National Cadastre Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>BhuDrishti 3D Cadastre • 14-Digit Bhu-Aadhaar Digital Twin</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Cadastral Land &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-teal-300">
                Vertical Property
              </span>{' '}
              Digital Twin
            </h1>

            {/* Sub-paragraph */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              <strong>BhuDrishti 3D</strong> transforms Indian property records with geo-precise 3D polygon
              extrusions from official <strong>ULPIN / Bhu-Aadhaar</strong> surveys, mapping floor-by-floor
              vertical spatial rights on top of surveyed land parcels.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="btn-hero-explore-3d"
                onClick={() => onOpenViewer(featuredParcel)}
                className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Interactive 3D Viewer</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                id="btn-hero-view-listings"
                onClick={() => onNavigateTab('listings')}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm flex items-center gap-2 border border-slate-700/80 transition-all shadow-md"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Explore Land Registry</span>
              </button>
            </div>

            {/* Key Feature Checkmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-Meter Precision Extrusions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Exploded Floor-by-Floor BIM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>RERA & Encumbrance Sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Featured Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative group bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-4 shadow-2xl transition-all">
              {/* Image Preview with 3D Mock Overlay */}
              <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950">
                <img
                  src={featuredParcel.images[0]}
                  alt={featuredParcel.building?.name || 'ULPIN 3D Property'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating ULPIN Chip */}
                <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {featuredParcel.ulpin}
                  </span>
                </div>

                {/* 3D Vertical indicator */}
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-sky-500/30 text-sky-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>{featuredParcel.building?.totalFloors} Stories</span>
                </div>

                {/* Bottom Card Meta */}
                <div className="absolute bottom-4 left-4 right-4 space-y-1 text-left">
                  <div className="text-xs font-mono text-amber-400">
                    {featuredParcel.surveyNumber}
                  </div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">
                    {featuredParcel.building?.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>
                      {featuredParcel.talukVillage}, {featuredParcel.district}
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      ₹ {featuredParcel.marketValuationCr} Cr
                    </span>
                  </div>
                </div>
              </div>

              {/* Showcase CTA Button */}
              <div className="pt-3">
                <button
                  id="btn-hero-launch-featured"
                  onClick={() => onOpenViewer(featuredParcel)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all group/btn border border-slate-700 hover:border-amber-400 shadow-md"
                >
                  <Building2 className="w-4 h-4 text-amber-400 group-hover/btn:text-slate-950" />
                  <span>Inspect 3D Parcel & Exploded Floors</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pan-India Stats Counter Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="text-center md:text-left space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">42,500+</div>
            <div className="text-xs text-slate-400">Parcels Mapped in 3D</div>
          </div>
          <div className="text-center md:text-left space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">14-Digit</div>
            <div className="text-xs text-slate-400">Bhu-Aadhaar Standardization</div>
          </div>
          <div className="text-center md:text-left space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400">99.8%</div>
            <div className="text-xs text-slate-400">Cadastral Boundary Precision</div>
          </div>
          <div className="text-center md:text-left space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-400">28 States</div>
            <div className="text-xs text-slate-400">Revenue Records Integration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

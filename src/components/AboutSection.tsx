import React from 'react';
import { 
  FileText, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  ExternalLink,
  Cpu,
  Compass
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-900/40 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Digital Land Governance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Understanding ULPIN: The "Aadhaar for Land"
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The Unique Land Parcel Identification Number (ULPIN), also branded as <strong>Bhu-Aadhaar</strong>,
            is an initiative by the Department of Land Resources (DoLR), Government of India, to assign a unique
            14-digit alphanumeric code to every surveyed parcel of land based on international longitude and latitude standards.
          </p>
        </div>

        {/* 3 Pillars of 3D Cadastre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Geo-Coordinates Centric</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike traditional village revenue survey numbers that shift upon subdivision, a ULPIN is
              derived directly from the geometric centroid and vertex coordinates of the land parcel,
              preventing fraudulent duplicate sales.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">The Vertical Property Dilemma</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In modern Indian megacities like Mumbai, Bengaluru, and Delhi NCR, high-rises stack dozens of
              different owners on a single land footprint. Our 3D Property Mapper brings 3D Cadastre
              technology to assign vertical spatial rights to every individual apartment or commercial unit.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Institutional & Banking Grade</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides real estate lenders, NBFCs, and homebuyers with instant visual cross-checks
              against approved FAR (Floor Area Ratio), RERA layouts, fire setbacks, and physical boundaries.
            </p>
          </div>
        </div>

        {/* Technical Architecture Breakdown */}
        <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>How BhuDrishti 3D Generates Spatial Geometries</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-mono text-amber-400 font-bold">Step 1: Ingestion</span>
              <p className="text-slate-400">
                14-digit ULPIN or GeoJSON boundary vertices are parsed, normalized to WGS-84 coordinate system.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-mono text-amber-400 font-bold">Step 2: Extrusion</span>
              <p className="text-slate-400">
                Three.js vector projection extrudes the horizontal cadastral polygon with boundary stone beacons and setback lines.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-mono text-amber-400 font-bold">Step 3: Vertical Stacking</span>
              <p className="text-slate-400">
                Vertical building footprints are aligned to municipal setbacks and sliced into discrete floor meshes with unit boundaries.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-mono text-amber-400 font-bold">Step 4: Interactive Explode</span>
              <p className="text-slate-400">
                Dynamic Raycaster enables clicking any individual floor slab or unit to inspect RERA specs, pricing, and blueprints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Compass, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC<{ onSelectTab: (tab: any) => void }> = ({ onSelectTab }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-xs text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight">
                BhuDrishti 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              India's premier 3D cadastral digital twin and vertical property spatial rights visualization platform.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bhu-Aadhaar & RERA Compliant</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Platform Modules
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button onClick={() => onSelectTab('viewer')} className="hover:text-amber-300">
                  Interactive 3D Cadastre Viewer
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('listings')} className="hover:text-amber-300">
                  Land Registry & Parcels
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('admin')} className="hover:text-amber-300">
                  Spatial Data Entry Studio
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('services')} className="hover:text-amber-300">
                  Drone & LiDAR Mapping
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              State Portals Reference
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li>Maharashtra Mahabhulekh & IGR</li>
              <li>Karnataka Bhoomi & Kaveri 2.0</li>
              <li>Telangana Dharani Portal</li>
              <li>Haryana Jamabandi Cadastre</li>
              <li>Gujarat AnyRoR & Revenue Dept</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Spatial Standards
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Based on Open Geospatial Consortium (OGC) LandAdmin Domain Model (LADM ISO 19152) and
              Digital India Land Records Modernization Programme (DILRMP).
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} ULPIN 3D Property Mapper. Built for precision Indian land records visualization.
          </div>
          <div className="flex items-center gap-4">
            <span>ISO 19152 3D Cadastre</span>
            <span>WGS-84 Coordinate Grid</span>
            <span>Bhu-Aadhaar Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

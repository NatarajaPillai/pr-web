import React from 'react';
import { 
  Box, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  FileCheck2, 
  Cpu, 
  Compass, 
  Database, 
  Smartphone,
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const ServicesSection: React.FC<{ onNavigateToViewer: () => void }> = ({ onNavigateToViewer }) => {
  const services = [
    {
      icon: Box,
      title: '3D Parcel Extrusion & Cadastral Mapping',
      description:
        'Transform static 2D revenue village maps and survey records into mathematically precise 3D polygonal terrain volumes using vertex latitude and longitude coordinates.',
      tags: ['Bhu-Aadhaar', 'Lat/Lng Polygons', 'LiDAR Compatible'],
    },
    {
      icon: Layers,
      title: 'Vertical Property & Air-Rights Titling',
      description:
        'Bridge the gap between ground land parcel boundaries and multi-story high-rise developments. Layer vertical spatial units with distinct RERA and municipal titling.',
      tags: ['Exploded Floor BIM', 'Unit Level Cadastre', 'FAR / FSI Tracking'],
    },
    {
      icon: ShieldCheck,
      title: 'Dispute-Free Land Record Due Diligence',
      description:
        'Cross-reference mutation certificates, encumbrance records, and spatial overlaps to protect developers, institutional buyers, and individual investors.',
      tags: ['Zero Boundary Overlap', 'Title Chain', 'Deed Audit'],
    },
    {
      icon: FileCheck2,
      title: 'RERA Unit Inventory & Real-Time Availability',
      description:
        'Interactive floor plans and unit registries tracking available, booked, and sold units directly connected to state real estate regulatory authority filings.',
      tags: ['Live Inventory', 'Interactive Floorplans', 'Booking Lock'],
    },
    {
      icon: Cpu,
      title: 'Drone Photogrammetry & Satellite Integration',
      description:
        'Seamless integration with high-resolution CartoSat, Sentinel, and licensed drone survey point-clouds to match ground truth with revenue records.',
      tags: ['Centimeter Accuracy', 'Elevation Profiles', 'NDVI Ground'],
    },
    {
      icon: Database,
      title: 'State Revenue & Bhoomi API Integrations',
      description:
        'Interoperable with Mahabhulekh, Karnataka Bhoomi, Dharani Telangana, Bhulekh UP, and Jamabandi Haryana for automated record synchronization.',
      tags: ['Open GeoJSON', 'REST Cadastre API', '7/12 Extract Sync'],
    },
  ];

  return (
    <section className="py-16 bg-slate-950/60 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <span>Enterprise Cadastral Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Specialized 3D Land & Vertical Spatial Services
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Pioneering the modern 3D Cadastre stack for Indian municipal corporations, Tier-1 builders,
            and institutional real estate funds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA banner */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white">
              Ready to verify or map your land parcel in 3D?
            </h3>
            <p className="text-xs text-slate-400">
              Instant Bhu-Aadhaar lookup, vertical footprint generation, and cadastral certificate export.
            </p>
          </div>
          <button
            onClick={onNavigateToViewer}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl shrink-0 transition-all"
          >
            <span>Launch 3D Explorer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

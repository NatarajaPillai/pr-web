import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Compass, 
  Search, 
  PlusCircle, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'viewer' | 'listings' | 'services' | 'about' | 'admin';
  onSelectTab: (tab: 'home' | 'viewer' | 'listings' | 'services' | 'about' | 'admin') => void;
  onOpenQuickSearch: () => void;
  onOpenEnquiry: () => void;
}

interface NavItem {
  id: 'home' | 'viewer' | 'listings' | 'services' | 'about' | 'admin';
  label: string;
  highlight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickSearch,
  onOpenEnquiry,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'viewer', label: 'Interactive 3D Viewer', highlight: true },
    { id: 'listings', label: 'Land Registry' },
    { id: 'services', label: 'GIS & Services' },
    { id: 'about', label: 'About BhuDrishti' },
    { id: 'admin', label: 'Admin Studio' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  BhuDrishti 3D
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Digital Twin
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-mono">
                Cadastral Land & Property GIS
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  } ${item.highlight && !isActive ? 'text-amber-400/90' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button
              id="btn-nav-quick-search"
              onClick={onOpenQuickSearch}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Search Cadastral ULPIN"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              id="btn-nav-enquiry"
              onClick={onOpenEnquiry}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Inspection</span>
            </button>
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                activeTab === item.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenEnquiry();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs text-center"
            >
              Book Inspection / Due Diligence
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

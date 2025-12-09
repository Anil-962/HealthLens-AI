
import React from 'react';
import { Stethoscope } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300 h-[72px]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              HealthLens<span className="text-blue-600">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 leading-none">
              Medical Intelligence Engine
            </p>
          </div>
        </div>
        
        {/* Right Side: Badges */}
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center px-3 py-1 bg-indigo-50/80 border border-indigo-100 rounded-full backdrop-blur-sm shadow-sm transition-all hover:bg-indigo-50">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase">Gemini 3 Pro</span>
            </div>
            <div className="flex items-center px-3 py-1 bg-slate-100/80 border border-slate-200 rounded-full backdrop-blur-sm shadow-sm hover:bg-slate-100 transition-all">
                <span className="text-[10px] font-bold text-slate-600 tracking-wide uppercase">Preview v1.0</span>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

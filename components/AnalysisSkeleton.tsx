
import React from 'react';
import { motion } from 'framer-motion';

const AnalysisSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full pb-8">
      {/* Snapshot Card Skeleton */}
      <div className="relative h-72 w-full bg-slate-200/50 rounded-2xl overflow-hidden border border-white/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
        
        <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="space-y-3 w-1/2">
                    <div className="h-6 w-8 bg-slate-300/50 rounded-lg animate-pulse" />
                    <div className="h-8 w-3/4 bg-slate-300/50 rounded-lg animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-300/30 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-8 w-24 bg-slate-300/30 rounded-lg animate-pulse" />
                    <div className="h-8 w-24 bg-slate-300/30 rounded-lg animate-pulse" />
                </div>
            </div>

            <div className="space-y-4">
                 <div className="h-4 w-full bg-slate-300/30 rounded animate-pulse" />
                 <div className="h-4 w-11/12 bg-slate-300/30 rounded animate-pulse" />
                 <div className="h-4 w-5/6 bg-slate-300/30 rounded animate-pulse" />
            </div>
            
            <div className="flex gap-2 mt-4">
                <div className="h-6 w-20 bg-slate-300/40 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-slate-300/40 rounded-full animate-pulse" />
            </div>
        </div>
      </div>

      {/* Grounding Source Skeleton */}
      <div className="h-24 bg-white/60 rounded-xl border border-slate-200/50 p-5 flex flex-col justify-center gap-3">
         <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
         <div className="flex gap-2">
            <div className="h-8 w-40 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-8 w-40 bg-slate-100 rounded-lg animate-pulse" />
         </div>
      </div>

      {/* Sections Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm opacity-60">
             <div className="flex items-center gap-4 w-full">
                <div className="h-10 w-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-2 flex-1">
                    <div className="h-5 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                </div>
             </div>
             <div className="h-6 w-6 bg-slate-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* CSS for custom shimmer since we can't edit tailwind.config */}
      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisSkeleton;

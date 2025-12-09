
import React from 'react';
import { AnalysisData } from '../types';
import { Zap, Gauge, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightsPanelProps {
  data: AnalysisData | null;
  history: AnalysisData[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ data, history }) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.15 }
        }
      }}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      
      {/* 1. Key Signals */}
      {data && (
        <motion.section 
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 }
          }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300"
        >
            <div className="flex items-center gap-2 mb-4 text-slate-800 border-b border-slate-100 pb-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Key Signals</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {data.key_signals?.map((signal, idx) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                        {signal}
                    </span>
                )) || <span className="text-xs text-slate-400 font-medium">No signals extracted.</span>}
            </div>
        </motion.section>
      )}

      {/* 2. Meters */}
      {data && (
        <motion.section 
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 }
          }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300"
        >
            <div className="flex items-center gap-2 mb-4 text-slate-800 border-b border-slate-100 pb-2">
                <Gauge className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Quality Meters</h3>
            </div>
            
            <div className="space-y-5">
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500 font-bold">Evidence Clarity</span>
                        <span className={`font-bold ${data.evidence_clarity === 'High' ? 'text-green-600' : 'text-slate-700'}`}>{data.evidence_clarity}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] ${data.evidence_clarity === 'High' ? 'w-full' : data.evidence_clarity === 'Medium' ? 'w-2/3' : 'w-1/3'}`} 
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500 font-bold">Document Quality</span>
                        <span className={`font-bold ${data.document_quality === 'Strong' ? 'text-indigo-600' : 'text-slate-700'}`}>{data.document_quality}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                         <div 
                            className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] ${data.document_quality === 'Strong' ? 'w-full' : data.document_quality === 'Moderate' ? 'w-2/3' : 'w-1/3'}`} 
                        />
                    </div>
                </div>
            </div>
        </motion.section>
      )}

      {/* 3. Session History */}
      <motion.section 
        variants={{
          hidden: { opacity: 0, x: 20 },
          show: { opacity: 1, x: 0 }
        }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50 min-h-[150px] hover:-translate-y-1 transition-transform duration-300"
      >
            <div className="flex items-center gap-2 mb-4 text-slate-800 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Analyses</h3>
            </div>
            
            {history.length > 0 ? (
                <div className="space-y-3">
                    {history.map((item, idx) => (
                        <div key={idx} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 group cursor-pointer">
                            <p className="text-xs font-bold text-slate-700 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {item.plain_summary.substring(0, 60)}...
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                {item.study_type} • <span className={item.evidence_strength === 'High' ? 'text-green-600' : 'text-amber-500'}>{item.evidence_strength}</span>
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-24 text-slate-300">
                    <History className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs font-medium">No recent history</p>
                </div>
            )}
      </motion.section>

    </motion.div>
  );
};

export default InsightsPanel;

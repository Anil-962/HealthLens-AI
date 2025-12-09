
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Beaker, 
  BarChart, 
  AlertTriangle, 
  ShieldAlert, 
  User, 
  Stethoscope, 
  Files, 
  Map as MapIcon,
  Activity,
  Volume2,
  Loader2,
  ExternalLink,
  Search,
  Image as ImgIcon,
  X
} from 'lucide-react';
import { AnalysisData } from '../types';
import { generateAudioSummary, generateSpokenScript, generateVisualSummary } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ 
  title,
  description,
  icon: Icon, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, rotateX: -15, y: -20 },
        show: { opacity: 1, rotateX: 0, y: 0 }
      }}
      className={`border-b-4 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300 transform-gpu ${isOpen ? 'border-blue-500 shadow-lg ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shadow-sm ${isOpen ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${isOpen ? 'text-blue-900' : 'text-slate-700'}`}>{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="p-6 pt-2 border-t border-slate-100 bg-white">
                    <div className="prose prose-slate prose-sm max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-800 prose-li:text-slate-600">
                        {children}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface AnalysisResultProps {
  data: AnalysisData;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handlePlaySummary = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audio) {
      audio.play();
      setIsPlaying(true);
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const script = await generateSpokenScript(data);
      const audioUrl = await generateAudioSummary(script);
      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio error", e);
      alert("Could not generate audio explanation.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
        const imageUrl = await generateVisualSummary(data.plain_summary);
        setGeneratedImage(imageUrl);
    } catch (e) {
        console.error(e);
        alert("Could not generate image.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Processing Warnings */}
      {data.processing_warnings && data.processing_warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h3 className="text-amber-800 font-bold text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Processing Warnings
            </h3>
            <ul className="list-disc list-inside text-xs text-amber-700 space-y-1 font-medium">
                {data.processing_warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                ))}
            </ul>
        </div>
      )}
      
      {/* Snapshot Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01, rotateX: 1, transition: { type: "spring", stiffness: 300 } }}
        className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-2xl perspective-[1000px] transform-gpu overflow-hidden border border-white/10"
      >
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                   <Activity className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                   <h2 className="text-xl font-bold tracking-tight">Executive Snapshot</h2>
                   <p className="text-xs text-blue-200 font-medium">Key insights at a glance</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !!generatedImage}
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg text-xs font-bold transition-all border border-white/10 text-blue-100 disabled:opacity-50 hover:shadow-lg shadow-black/20"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImgIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                )}
                {isGeneratingImage ? 'Creating...' : 'Visualize'}
              </button>

              <button 
                onClick={handlePlaySummary}
                disabled={isGeneratingAudio}
                className={`group flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/50 text-white border border-transparent ${isPlaying ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}`}
              >
                {isGeneratingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                )}
                {isGeneratingAudio ? 'Generating...' : isPlaying ? 'Stop Audio' : 'Listen'}
              </button>
            </div>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/10 text-blue-100 backdrop-blur-md">
               {data.study_type || 'Unspecified Type'}
            </span>
             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/10 text-blue-100 backdrop-blur-md">
               Strength: <span className={data.evidence_strength === 'High' ? 'text-green-400 ml-1' : 'text-amber-400 ml-1'}>{data.evidence_strength}</span>
            </span>
        </div>

        <div className="relative z-10 space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
             {data.key_findings.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-200 font-medium">
                    <div className="min-w-[6px] h-[6px] rounded-full bg-blue-400 mt-2 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    <span className="leading-relaxed"><ReactMarkdown components={{ p: React.Fragment }}>{item}</ReactMarkdown></span>
                </div>
            ))}
        </div>

        {/* Generated Image Display */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="relative z-10 rounded-xl overflow-hidden border border-white/20 shadow-2xl"
            >
               <img src={generatedImage} alt="Visual Summary" className="w-full h-auto object-cover" />
               <div className="absolute top-3 right-3">
                 <button 
                   onClick={() => setGeneratedImage(null)}
                   className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors backdrop-blur-md"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                 <p className="text-sm text-white font-bold flex items-center gap-2">
                    <ImgIcon className="w-4 h-4 text-blue-400" />
                    AI-Generated Visual Summary
                 </p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Grounding Sources (If Available) */}
      {data.grounding_urls && data.grounding_urls.length > 0 && (
         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm flex flex-col gap-3"
         >
            <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wide">
              <Search className="w-3.5 h-3.5" />
              <span>Verified Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.grounding_urls.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                >
                  <ExternalLink className="w-3 h-3 group-hover:text-blue-500" />
                  <span className="truncate max-w-[200px]">{source.title}</span>
                </a>
              ))}
            </div>
         </motion.div>
      )}

      {/* Sections */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="space-y-4 perspective-[1000px]"
      >
        
        <Section 
            title="Plain Summary" 
            description="What the uploaded content is about and the main story." 
            icon={FileText} 
            defaultOpen={true}
        >
          <ReactMarkdown>{data.plain_summary}</ReactMarkdown>
        </Section>

        <Section 
            title="Key Findings" 
            description="Primary outcomes, effect sizes and key numbers." 
            icon={Lightbulb}
        >
             <ul className="list-disc pl-5 space-y-2">
                {data.key_findings.map((item, idx) => (
                    <li key={idx}><ReactMarkdown>{item}</ReactMarkdown></li>
                ))}
            </ul>
        </Section>

        <Section 
            title="Methods & Study Design" 
            description="Population, interventions, controls, and endpoints." 
            icon={Beaker}
        >
          <ReactMarkdown>{data.methods}</ReactMarkdown>
        </Section>

        <Section 
            title="Data Interpretation" 
            description="What the charts, tables and numerical results are actually saying." 
            icon={BarChart}
        >
          <ReactMarkdown>{data.data_interpretation}</ReactMarkdown>
        </Section>

        <Section 
            title="Risks & Safety" 
            description="Reported side effects, adverse events or harms." 
            icon={AlertTriangle}
        >
          <ReactMarkdown>{data.risks}</ReactMarkdown>
        </Section>

        <Section 
            title="Limitations & Biases" 
            description="Weaknesses, confounding factors or missing data." 
            icon={ShieldAlert}
        >
          <ReactMarkdown>{data.limitations}</ReactMarkdown>
        </Section>

        <Section 
            title="Explanation for Patients" 
            description="Simplified explanation at a layperson level." 
            icon={User}
        >
            <ReactMarkdown>{data.patient_explanation}</ReactMarkdown>
        </Section>

        <Section 
            title="Explanation for Clinicians" 
            description="Technical details, stats and mechanisms." 
            icon={Stethoscope}
        >
            <ReactMarkdown>{data.clinician_explanation}</ReactMarkdown>
        </Section>

        <Section 
            title="Cross-Document Comparison" 
            description="Comparison of findings across uploaded files." 
            icon={Files}
        >
            <ReactMarkdown>
                {data.cross_comparison || "Only one document uploaded, providing internal comparison."}
            </ReactMarkdown>
        </Section>

        <Section 
            title="Clinical Takeaway" 
            description="Key considerations for interpretation (not advice)." 
            icon={MapIcon}
        >
          <ReactMarkdown>{data.clinical_takeaway}</ReactMarkdown>
        </Section>
      </motion.div>
    </div>
  );
};

export default AnalysisResult;

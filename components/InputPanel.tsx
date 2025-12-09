
import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './FileUpload';
import { FilePreview, UserRole, FocusArea, AppStatus, AnalysisMode } from '../types';
import { Sparkles, AlertTriangle, Mic, MicOff, Loader2, ChevronDown, Square, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transcribeAudio } from '../services/geminiService';

interface InputPanelProps {
  files: FilePreview[];
  setFiles: (files: FilePreview[]) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  focus: FocusArea;
  setFocus: (focus: FocusArea) => void;
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  onAnalyze: () => void;
  onSave: () => void;
  status: AppStatus;
}

const InputPanel: React.FC<InputPanelProps> = ({
  files,
  setFiles,
  role,
  setRole,
  focus,
  setFocus,
  mode,
  setMode,
  notes,
  setNotes,
  onAnalyze,
  onSave,
  status
}) => {
  const isAnalyzing = status === AppStatus.ANALYZING;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        try {
          const text = await transcribeAudio(audioBlob);
          if (text) {
             setNotes(prev => (prev ? prev + ' ' + text : text));
          }
        } catch (error) {
          console.error("Transcription failed", error);
          alert("Could not transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
          setRecordingDuration(0);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current) {
        // Remove the onstop handler to prevent transcription
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  return (
    <div className="h-full flex flex-col gap-8">
      
      {/* File Section */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Uploaded Files
        </h2>
        <FileUpload 
          files={files} 
          onFilesSelected={setFiles} 
          disabled={isAnalyzing} 
        />
      </section>

      {/* Role Selector */}
      <section>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">I am a</label>
        <div className="relative">
            <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isAnalyzing}
            className="w-full appearance-none p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner hover:bg-white"
            >
            <option value="Student">Student</option>
            <option value="Clinician">Clinician</option>
            <option value="Researcher">Researcher</option>
            <option value="Other">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </section>

      {/* Focus Selector */}
      <section>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Focus on</label>
        <div className="relative">
            <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as FocusArea)}
            disabled={isAnalyzing}
            className="w-full appearance-none p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner hover:bg-white"
            >
            <option value="Overall summary">Overall summary</option>
            <option value="Methods and design quality">Methods and design quality</option>
            <option value="Results and graphs">Results and graphs</option>
            <option value="Risks and safety">Risks and safety</option>
            <option value="Limitations and bias">Limitations and bias</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </section>

      {/* Mode Selector */}
      <section>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Analysis Mode</label>
        <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner">
            <button
                onClick={() => setMode('deep')}
                disabled={isAnalyzing}
                className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${mode === 'deep' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Deep Analysis
                <span className="block text-[10px] font-medium opacity-60 mt-0.5">Thinking • Detailed</span>
            </button>
            <button
                onClick={() => setMode('quick')}
                disabled={isAnalyzing}
                className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg transition-all ${mode === 'quick' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Quick Scan
                <span className="block text-[10px] font-medium opacity-60 mt-0.5">Flash • Summary</span>
            </button>
        </div>
      </section>

      {/* Notes */}
      <section className="flex-grow min-h-[160px] relative">
        <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Context</label>
            
            {/* Initial Voice Button (Visible only when not recording) */}
            {!isRecording && !isTranscribing && !isAnalyzing && (
                <button
                    onClick={startRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                >
                    <Mic className="w-3 h-3" />
                    Dictate
                </button>
            )}
        </div>
        
        <div className="relative w-full h-full">
            <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isAnalyzing || isTranscribing || isRecording}
            placeholder="Add specific questions, context, or notes here..."
            className={`w-full h-full p-4 text-sm font-medium border rounded-xl outline-none transition-all resize-none shadow-inner bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400`}
            />

            {/* Transcribing Overlay */}
            {isTranscribing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 border border-blue-100">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-sm font-bold text-blue-700">Transcribing audio...</p>
                </div>
            )}

            {/* Recording Overlay */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-slate-900 rounded-xl flex flex-col items-center justify-center z-20 text-white p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between w-full mb-4">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recording</span>
                            </div>
                            <span className="text-xl font-mono font-bold tracking-widest">{formatTime(recordingDuration)}</span>
                        </div>

                        {/* Waveform Animation */}
                        <div className="flex items-center justify-center gap-1.5 h-16 mb-8 w-full">
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        height: [16, Math.random() * 48 + 16, 16],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 0.8,
                                        delay: i * 0.05,
                                        ease: "easeInOut"
                                    }}
                                    className="w-2 bg-blue-500 rounded-full"
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-4 w-full">
                            <button 
                                onClick={cancelRecording}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors text-slate-300"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button 
                                onClick={stopRecording}
                                className="flex-[2] flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-900/50"
                            >
                                <Square className="w-4 h-4 fill-current" />
                                Stop & Transcribe
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-3">
        <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98, translateY: 2 }}
            onClick={onAnalyze}
            disabled={files.length === 0 || isAnalyzing || isRecording || isTranscribing}
            className="w-full group relative flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-white bg-gradient-to-b from-blue-600 to-blue-700 rounded-xl disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-[0_6px_0_#1e40af] active:shadow-none active:translate-y-[6px] hover:shadow-[0_8px_0_#1e40af] hover:from-blue-500 hover:to-blue-600"
        >
            <Sparkles className="w-5 h-5" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Medical Content'}
        </motion.button>

        <button
            onClick={onSave}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
        >
            <Save className="w-3.5 h-3.5" />
            Save Inputs & Continue Later
        </button>

        <div className="mt-1 flex items-center justify-center gap-2">
             <AlertTriangle className="w-3 h-3 text-slate-400" />
             <p className="text-[10px] text-slate-400 font-medium">
                Not a medical device. For research use only.
             </p>
        </div>
      </div>

    </div>
  );
};

export default InputPanel;

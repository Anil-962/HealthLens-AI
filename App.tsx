
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import AnalysisResult from './components/AnalysisResult';
import InsightsPanel from './components/InsightsPanel';
import ChatInterface from './components/ChatInterface';
import AnalysisSkeleton from './components/AnalysisSkeleton';
import { AppStatus, FilePreview, AnalysisState, UserRole, FocusArea, AnalysisData, AnalysisMode } from './types';
import { analyzeMedicalDocuments, initChatSession } from './services/geminiService';
import { Loader2, Download, Copy, Check, Info, MessageSquare, X, Save, RotateCcw } from 'lucide-react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  // Input State
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [role, setRole] = useState<UserRole>('Student');
  const [focus, setFocus] = useState<FocusArea>('Overall summary');
  const [mode, setMode] = useState<AnalysisMode>('deep');
  const [notes, setNotes] = useState<string>("");

  // Analysis State
  const [state, setState] = useState<AnalysisState>({
    status: AppStatus.IDLE,
    data: null,
    error: null,
  });

  // Session History State
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Interpreting Data...");

  // Loading Messages Rotation
  useEffect(() => {
    if (state.status !== AppStatus.ANALYZING) return;
    const messages = [
        "Reading documents...",
        "Identifying key findings...",
        "Cross-referencing data...",
        "Synthesizing clinical insights...",
        "Verifying with external sources...",
        "Formatting final report..."
    ];
    let i = 0;
    const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [state.status]);

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const savedSession = localStorage.getItem('healthlens_session');
    if (savedSession) {
      setShowRestoreBanner(true);
    }
  }, []);

  const handleSaveSession = () => {
    try {
      const sessionData = {
        role,
        focus,
        notes,
        mode,
        data: state.data,
        history,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('healthlens_session', JSON.stringify(sessionData));
      alert("Session saved successfully! You can resume later.");
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save session. Local storage might be full.");
    }
  };

  const handleRestoreSession = async () => {
    try {
      const saved = localStorage.getItem('healthlens_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRole(parsed.role || 'Student');
        setFocus(parsed.focus || 'Overall summary');
        setNotes(parsed.notes || '');
        setMode(parsed.mode || 'deep');
        
        if (parsed.data) {
          setState({
            status: AppStatus.SUCCESS,
            data: parsed.data,
            error: null
          });
          await initChatSession(parsed.data.markdown_report);
          setIsChatReady(true);
        }

        if (parsed.history) {
          setHistory(parsed.history);
        }
      }
    } catch (e) {
      console.error("Restore failed", e);
    } finally {
      setShowRestoreBanner(false);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setState({ status: AppStatus.ANALYZING, data: null, error: null });
    setIsChatReady(false);
    setLoadingMessage("Reading documents...");

    try {
      const fileObjects = files.map(f => f.file);
      const data = await analyzeMedicalDocuments(fileObjects, notes, role, focus, mode);
      setState({ status: AppStatus.SUCCESS, data, error: null });
      setHistory(prev => [data, ...prev]);
      
      await initChatSession(data.markdown_report);
      setIsChatReady(true);
      
    } catch (error: any) {
      setState({ 
        status: AppStatus.ERROR, 
        data: null, 
        error: error.message || "An unexpected error occurred." 
      });
    }
  };

  const handleCopy = async () => {
    if (!state.data) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(state.data.markdown_report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadPDF = async () => {
     if (!state.data) return;
     setIsDownloading(true);
     setShowToast(true);

     // Safety timeout: Ensure we reset state if the print dialog doesn't trigger correctly or user cancels in a way we can't detect
     // We remove the conditional check to avoid stale closure issues
     const safetyTimeout = setTimeout(() => {
         setIsDownloading(false);
         setShowToast(false);
     }, 5000);

     try {
         const iframe = document.createElement('iframe');
         iframe.style.display = 'none';
         document.body.appendChild(iframe);
         
         const parsedHtml = await marked.parse(state.data.markdown_report);
         
         iframe.onload = () => {
             try {
                const win = iframe.contentWindow;
                if (win) {
                    win.focus();
                    win.print();
                }
             } catch (e) {
                console.error("Print failed", e);
             } finally {
                clearTimeout(safetyTimeout);
                setIsDownloading(false);
                setTimeout(() => setShowToast(false), 2000);
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 2000);
             }
         };

         const doc = iframe.contentWindow?.document;
         if (!doc) {
             clearTimeout(safetyTimeout);
             setIsDownloading(false);
             setShowToast(false);
             return;
         }

         const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>HealthLens AI Report</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap');
                    
                    body { 
                        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
                        color: #1e293b; 
                        line-height: 1.6; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background-color: white;
                    }
                    @page { margin: 2cm; size: A4; }
                    
                    /* Typography */
                    h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; border-bottom: 4px solid #2563eb; padding-bottom: 16px; display: inline-block; }
                    h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; page-break-after: avoid; }
                    h3 { font-size: 16px; font-weight: 600; color: #334155; margin-top: 24px; margin-bottom: 8px; page-break-after: avoid; }
                    p { font-size: 14px; margin-bottom: 12px; text-align: justify; color: #334155; }
                    li { font-size: 14px; margin-bottom: 6px; color: #334155; }
                    ul, ol { padding-left: 20px; margin-bottom: 16px; }
                    strong { font-weight: 600; color: #1e293b; }
                    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #475569; font-style: italic; margin: 16px 0; }
                    
                    /* Images */
                    img { max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px; border: 1px solid #e2e8f0; }
                    
                    /* Header & Meta */
                    .header { margin-bottom: 40px; }
                    .logo { font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                    .meta { 
                        font-size: 13px; 
                        color: #64748b; 
                        background: #f8fafc; 
                        padding: 16px; 
                        border-radius: 12px; 
                        border: 1px solid #e2e8f0; 
                        margin-bottom: 32px; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .meta-row:last-child { margin-bottom: 0; }
                    
                    /* Disclaimer */
                    .disclaimer { 
                        margin-top: 60px; 
                        padding: 20px; 
                        background: #fffbeb; 
                        border: 1px solid #fcd34d; 
                        border-radius: 8px; 
                        font-size: 12px; 
                        color: #92400e; 
                        page-break-inside: avoid; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }

                    /* Print specific overrides */
                    @media print { 
                        body { padding: 0; } 
                        .disclaimer { break-inside: avoid; } 
                        a { text-decoration: none; color: #0f172a; } 
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">HealthLens AI</div>
                    <h1>Medical Intelligence Report</h1>
                    <div class="meta">
                        <div class="meta-row">
                            <span><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</span>
                            <span><strong>AI Model:</strong> Gemini 3 Pro</span>
                        </div>
                        <div class="meta-row">
                             <span><strong>User Role:</strong> ${role}</span>
                             <span><strong>Focus:</strong> ${focus}</span>
                        </div>
                        ${notes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;"><strong>Notes:</strong> ${notes}</div>` : ''}
                    </div>
                </div>
                
                <div class="report-content">
                    ${parsedHtml}
                </div>
                
                <div class="disclaimer">
                    <strong>Disclaimer:</strong> This report is generated by an AI assistant (HealthLens AI) and may contain errors. It is for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always verify findings with original source documents and qualified medical professionals.
                </div>
            </body>
            </html>
         `;

         doc.open();
         doc.write(htmlContent);
         doc.close();

     } catch (err) {
         console.error("PDF Generation Error:", err);
         clearTimeout(safetyTimeout);
         setIsDownloading(false);
         setShowToast(false);
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-x-hidden">
      {/* 3D Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
         <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      {/* Restore Banner */}
      <AnimatePresence>
        {showRestoreBanner && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-40 bg-indigo-600 text-white shadow-lg border-b border-indigo-700 mt-[72px]"
            >
                <div className="px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-indigo-200" />
                        <p className="text-sm font-medium">Found a previously saved analysis session.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowRestoreBanner(false)}
                            className="text-indigo-200 hover:text-white text-sm font-medium transition-colors"
                        >
                            Dismiss
                        </button>
                        <button 
                            onClick={handleRestoreSession}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-50 transition-all shadow-[0_2px_0_#c7d2fe] active:translate-y-[1px] active:shadow-none"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Restore Session
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
            <motion.div 
                initial={{ opacity: 0, y: -50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-28 left-1/2 z-[60]"
            >
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700/50">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <div>
                        <p className="text-sm font-bold">Generating printable report</p>
                        <p className="text-xs text-slate-300">Please select "Save as PDF" in the print dialog.</p>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className={`relative z-10 flex-grow w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 perspective-[2000px] ${showRestoreBanner ? 'pt-6' : 'pt-28'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
            
            {/* LEFT PANEL */}
            <motion.div 
                initial={{ opacity: 0, x: -50, rotateY: 5 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:col-span-3 glass-panel rounded-2xl p-6 shadow-xl sticky top-28 h-[calc(100vh-9rem)] overflow-y-auto hidden lg:block custom-scrollbar"
            >
                <InputPanel 
                    files={files}
                    setFiles={setFiles}
                    role={role}
                    setRole={setRole}
                    focus={focus}
                    setFocus={setFocus}
                    mode={mode}
                    setMode={setMode}
                    notes={notes}
                    setNotes={setNotes}
                    onAnalyze={handleAnalyze}
                    onSave={handleSaveSession}
                    status={state.status}
                />
            </motion.div>
            
            {/* Mobile Left Panel Fallback */}
            <div className="lg:hidden glass-panel rounded-2xl p-5 shadow-xl">
                 <InputPanel 
                    files={files}
                    setFiles={setFiles}
                    role={role}
                    setRole={setRole}
                    focus={focus}
                    setFocus={setFocus}
                    mode={mode}
                    setMode={setMode}
                    notes={notes}
                    setNotes={setNotes}
                    onAnalyze={handleAnalyze}
                    onSave={handleSaveSession}
                    status={state.status}
                />
            </div>

            {/* CENTER PANEL */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="lg:col-span-6 min-h-[500px]"
            >
                {state.status === AppStatus.IDLE && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 backdrop-blur-sm">
                        <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <Info className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-xl font-bold text-slate-700">Ready to analyze</p>
                        <p className="text-sm mt-2 text-slate-500 max-w-xs mx-auto">Upload medical documents, images or videos on the left and click Analyze to start.</p>
                    </div>
                )}

                {state.status === AppStatus.ANALYZING && (
                    <div className="relative h-full">
                        {/* Skeleton Background */}
                        <div className="absolute inset-0 opacity-40 pointer-events-none filter blur-[1px] transition-opacity duration-500">
                             <AnalysisSkeleton />
                        </div>

                        {/* Floating Loading Indicator */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 perspective-[1000px]">
                            <motion.div 
                              animate={{ rotateY: 360, rotateX: 360, rotateZ: 90 }}
                              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                              className="w-24 h-24 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.4)] mb-8 opacity-90 backdrop-blur-xl border border-white/20"
                            />
                            <div className="bg-white/80 backdrop-blur-xl px-8 py-5 rounded-2xl shadow-2xl border border-white/40 flex flex-col items-center max-w-xs text-center">
                                <AnimatePresence mode="wait">
                                    <motion.h3 
                                        key={loadingMessage}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-lg font-bold text-slate-800 tracking-tight mb-1"
                                    >
                                        {loadingMessage}
                                    </motion.h3>
                                </AnimatePresence>
                                <p className="text-xs text-slate-500 font-medium">Gemini 3 Pro is thinking deep & verifying sources.</p>
                            </div>
                        </div>
                    </div>
                )}

                {state.status === AppStatus.ERROR && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-lg">
                        <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                           <X className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-red-900 mb-2">Analysis Failed</h3>
                        <p className="text-red-700 mb-6">{state.error}</p>
                        <button 
                            onClick={() => setState(prev => ({ ...prev, status: AppStatus.IDLE, error: null }))}
                            className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 shadow-sm transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {state.status === AppStatus.SUCCESS && state.data && (
                    <AnalysisResult data={state.data} />
                )}
            </motion.div>

            {/* RIGHT PANEL */}
            <motion.div 
                initial={{ opacity: 0, x: 50, rotateY: -5 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="lg:col-span-3 space-y-4 lg:sticky lg:top-28"
            >
                {state.status === AppStatus.SUCCESS && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopy}
                            disabled={isCopying || copied}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-[0_3px_0_#e2e8f0] active:translate-y-[3px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isCopying ? <Loader2 className="w-3 h-3 animate-spin" /> : (copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-blue-500" />)}
                            {isCopying ? 'Copying...' : (copied ? 'Copied' : 'Copy MD')}
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-900 rounded-xl text-xs font-bold text-white hover:bg-slate-900 transition-all shadow-[0_3px_0_#020617] active:translate-y-[3px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            {isDownloading ? 'Preparing...' : 'Download PDF'}
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveSession}
                            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-[0_3px_0_#c7d2fe] active:translate-y-[3px] active:shadow-none"
                        >
                            <Save className="w-3 h-3" />
                            Save & Continue Later
                        </motion.button>
                    </div>
                )}
                
                <InsightsPanel data={state.data} history={history} />
            </motion.div>
        </div>
      </main>

      {/* CHAT TOGGLE */}
      {state.status === AppStatus.SUCCESS && (
        <motion.button
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-[0_8px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.5)] transition-all z-40 flex items-center justify-center border-2 border-white/20"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </motion.button>
      )}

      {/* CHAT INTERFACE */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextLoaded={isChatReady}
      />
    </div>
  );
};

export default App;


import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon, File, ArrowDown, Trash2, Video, AlertCircle } from 'lucide-react';
import { FilePreview } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  files: FilePreview[];
  onFilesSelected: (files: FilePreview[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files: selectedFiles,
  onFilesSelected, 
  disabled 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // Auto-dismiss errors
  useEffect(() => {
    if (uploadErrors.length > 0) {
      const timer = setTimeout(() => setUploadErrors([]), 7000);
      return () => clearTimeout(timer);
    }
  }, [uploadErrors]);

  const validateFile = (file: File): { valid: boolean; reason?: string } => {
    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff', 'image/tif',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
    ];
    
    if (!allowedTypes.includes(file.type) && file.type !== '') {
       const ext = file.name.split('.').pop()?.toLowerCase();
       const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'mp4', 'mov', 'webm'];
       if (!ext || !allowedExts.includes(ext)) {
         return { valid: false, reason: 'Unsupported file format' };
       }
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { valid: false, reason: 'File exceeds 20MB limit' };
    }

    return { valid: true };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newPreviews: FilePreview[] = [];
    const newErrors: string[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        newErrors.push(`${file.name}: ${validation.reason}`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDisplayableImage = isImage && !file.type.includes('tiff');
      
      let type: 'pdf' | 'image' | 'video' | 'text' = 'text';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (isImage) type = 'image';
      else if (isVideo) type = 'video';
      
      newPreviews.push({
        id: Math.random().toString(36).substring(7),
        file,
        type,
        previewUrl: isDisplayableImage ? URL.createObjectURL(file) : (type === 'pdf' ? URL.createObjectURL(file) : undefined)
      });
    });

    if (newErrors.length > 0) {
      setUploadErrors(prev => [...prev, ...newErrors]);
    }

    if (newPreviews.length > 0) {
      const updatedFiles = [...selectedFiles, ...newPreviews];
      onFilesSelected(updatedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    const updated = selectedFiles.filter(f => f.id !== id);
    onFilesSelected(updated);
  };

  const clearAllFiles = () => {
    onFilesSelected([]);
    setUploadErrors([]);
  };

  return (
    <div className="w-full space-y-4 perspective-[1000px]">
      {/* Upload Zone */}
      <motion.div 
          animate={{
            borderColor: dragActive ? '#3b82f6' : (disabled ? '#cbd5e1' : '#e2e8f0'),
            backgroundColor: dragActive ? '#eff6ff' : (disabled ? '#f8fafc' : '#f8fafc'),
            scale: dragActive ? 1.02 : 1,
            rotateX: dragActive ? 5 : 0,
            boxShadow: dragActive ? "inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transform-gpu
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-slate-50'}`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) setDragActive(true); }}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
      >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/png,image/jpeg,image/jpg,image/tiff,image/tif,video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
          />
          
          <AnimatePresence mode="wait">
            {dragActive ? (
              <motion.div
                key="dragging"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-sm">
                  <ArrowDown className="w-8 h-8 text-blue-600 animate-bounce" />
                </div>
                <p className="text-blue-700 font-bold text-lg">Drop files here</p>
                <p className="text-blue-600/70 text-sm">Release to interpret</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-slate-100 group-hover:shadow-md transition-shadow">
                  <UploadCloud className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm text-slate-700 font-bold">
                  Click to upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, Images, or Video
                </p>
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>

      {/* Validation Errors */}
      <AnimatePresence>
        {uploadErrors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 overflow-hidden shadow-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-700 mb-1">Upload Issue</p>
                <ul className="text-[11px] text-red-600 space-y-0.5 list-disc list-inside">
                  {uploadErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setUploadErrors([])} className="text-red-400 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List Header & Actions */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'} Added
             </h3>
             <button
                onClick={clearAllFiles}
                disabled={disabled}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
             >
                <Trash2 className="w-3 h-3" />
                Clear All
             </button>
        </div>
      )}

      {/* File Cards */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar pb-2">
            {selectedFiles.map((item) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: -20, rotateX: -15 }}
                animate={{ opacity: 1, x: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateX: 15 }}
                whileHover={{ y: -2, scale: 1.01 }}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all transform-gpu"
              >
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mr-3 overflow-hidden border border-slate-100">
                    {item.type === 'image' && item.previewUrl ? (
                      <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : item.type === 'pdf' ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : item.type === 'video' ? (
                      <Video className="w-6 h-6 text-indigo-500" />
                    ) : (
                      <File className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[120px] sm:max-w-[150px]">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.type}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                  disabled={disabled}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;

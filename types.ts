
export interface FilePreview {
  id: string;
  file: File;
  previewUrl?: string; // For images and PDFs
  type: 'pdf' | 'image' | 'video' | 'text';
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type UserRole = 'Student' | 'Clinician' | 'Researcher' | 'Other';

export type FocusArea = 
  | 'Overall summary' 
  | 'Methods and design quality' 
  | 'Results and graphs' 
  | 'Risks and safety' 
  | 'Limitations and bias';

export type AnalysisMode = 'deep' | 'quick';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisData {
  // Content
  plain_summary: string;
  key_findings: string[];
  methods: string;
  data_interpretation: string;
  risks: string;
  limitations: string;
  patient_explanation: string;
  clinician_explanation: string;
  cross_comparison: string;
  clinical_takeaway: string;
  markdown_report: string;

  // Metadata & Metrics
  study_type: string;
  evidence_strength: 'Low' | 'Medium' | 'High';
  evidence_clarity: 'Low' | 'Medium' | 'High';
  document_quality: 'Limited' | 'Moderate' | 'Strong';
  key_signals: string[]; // Short chips

  // System
  processing_warnings?: string[];
  grounding_urls?: { title: string; url: string }[];
}

export interface AnalysisState {
  status: AppStatus;
  data: AnalysisData | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

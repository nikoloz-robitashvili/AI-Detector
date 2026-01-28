
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface DetectionResult {
  is_ai_generated: boolean | null;
  ai_probability_percent: number | null;
  confidence_level: ConfidenceLevel;
  analysis_summary: string;
  detected_language: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: DetectionResult;
  inputSnippet: string;
  inputType: 'text' | 'image';
}

export interface AnalysisState {
  isLoading: boolean;
  result: DetectionResult | null;
  error: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

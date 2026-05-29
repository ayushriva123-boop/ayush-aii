export interface FaceBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Recommendations {
  skincare: string[];
  style: string[];
  lifestyle: string[];
}

export interface FaceAnalysis {
  box: FaceBox;
  age: number;
  gender: string;
  confidence: number;
  mood: string;
  recommendations: Recommendations;
}

export interface AnalysisResponse {
  faces: FaceAnalysis[];
  error?: string;
}

export type ScanInterval = 2000 | 3000 | 5000 | 10000;

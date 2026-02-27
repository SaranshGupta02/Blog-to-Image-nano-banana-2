export interface BlogSection {
  id: string;
  heading: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

export type ImageStyle = 'cinematic' | 'flat';

export interface GenerationConfig {
  style: ImageStyle;
  isCinematicMode: boolean;
}

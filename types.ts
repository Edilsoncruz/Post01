
export enum AppStep {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  DETAIL = 'DETAIL'
}

export enum GenerationMode {
  FIDELITY = 'fidelity',
  CREATIVE = 'creative'
}

export interface MarketingInputs {
  clientName: string; 
  projectName: string;
  targetAudience: string;
  objective: string;
  guidance: string;
  // Existing image fields
  images: File[]; 
  imagesBase64: string[]; 
  
  // New fields for Text-Only Flow
  inputType: 'image' | 'text';
  textPrompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  
  mode: GenerationMode;
  conceptCount: number; // New field for number of concepts
}

export interface VideoSettings {
  scenario: string;
  vfx: string;
  camera: string;
  comment: string;
}

// Updated structure for Product Commercials
export interface VideoJsonOutput {
  _meta: {
    type: string;
    aspect_ratio: string;
    target_output: string;
  };
  scene_elements: {
    subject_details: string; // English
    environment_context: string; // English
    visual_effects: string; // English
  };
  cinematography: {
    camera_movement: string; // English
    shot_type: string; // English
    lighting_style: string; // English
    art_style: string; // English
  };
  audio_production: {
    voice_profile: {
      gender: 'Male' | 'Female';
      tone: string; // English adjectives
      is_voiceover: boolean;
    };
    script_pt_br: string; // Portuguese
  };
  narrative?: string;
  voice_type?: string;
  extra_guidance?: string;
}

// Detailed guide for editing specific images
export interface ImageEditingGuide {
  mainHeadline: string; 
  mainFont: string; 
  secondaryText: string;
  secondaryFont: string; 
  visualElements: string; 
  ctaButton: string;
  placementTips: string;
  canvaPrompt: string;
}

export interface VisualStrategy {
  colorPalette: string[];
  typographySuggestion: string; 
  artStyle: string;
  specificGuides: ImageEditingGuide[]; 
}

export interface CopywritingAttributes {
  socialCaptionHeadlines: string[];
  caption: string;
  hashtags: string[];
  hook: string;
  body: string;
  finalCta: string;
}

export interface Scene {
  id: string;
  sequenceNumber: number;
  type: 'INTRO' | 'ACTION' | 'DETAIL' | 'CTA';
  description: string;
  visualPrompt: string;
  imageUrl: string | null;
  videoJson: VideoJsonOutput;
}

export interface Storyboard {
  baseImageIndex: number;
  scenes: Scene[];
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  visualPrompts: string[];
  generatedImageUrls?: (string | null)[]; 
  visualStrategy?: VisualStrategy; 
  // Generic fallback
  copywriting: CopywritingAttributes;
  // Specific per variation
  specificCopywriting?: CopywritingAttributes[];
  videoJsonTemplate: VideoJsonOutput; 
  storyboard?: Storyboard;
}

export interface StrategyResponse {
  ideas: Idea[];
}

export interface MentorshipResult {
  score: number;
  feedback: string;
  comparison: string;
}

export interface ProjectHistoryItem {
  id: string;
  timestamp: number;
  clientName: string;
  projectName: string;
  inputs: MarketingInputs;
  ideas: Idea[];
}

export interface SheetRow {
  timestamp: string;
  clientName: string;
  mode: string;
  audience: string;
  objective: string;
  guidance: string;
  ideaTitle?: string;
  ideaDescription?: string;
  copyHeadlines?: string;
  copyCaption?: string;
  videoPrompt?: string;
}

type ModelVersion = {
  id: number;
  baseModel: string;
  trainedWords: string[];
  files: { id: number, name: string, primary: boolean, downloadUrl: string }[];
  images: { url: string }[];
}

export type CivitaiResource = {
  id: number;
  name: string;
  description: string;
  type: 'LORA' | 'Checkpoint' | 'TextualInversion' | 'Hypernetwork' | 'AestheticGradient' | 'Controlnet';
  tags: string[]; 
  modelVersions: ModelVersion[]
}
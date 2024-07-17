export type CivitaiResource = {
  id: number;
  name: string;
  description: string;
  type: 'LORA' | 'Checkpoint' | 'TextualInversion' | 'Hypernetwork' | 'AestheticGradient' | 'Controlnet';
  tags: string[];
  modelVersions: { id: number, baseModel: string, files: { id: number, name: string, primary: boolean, downloadUrl: string }[]}[]
}
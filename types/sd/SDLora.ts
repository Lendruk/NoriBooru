import { MediaItemSchema } from "../../backend/src/db/vault/schema";
import { PopulatedTag } from "../../backend/src/services/TagService";

export type SDLora = {
  id: string;
  name: string;
  path: string;
  metadata: {
    ss_sd_model_name: string;
    ss_resolution: string;
    ss_clip_skip: string;
    ss_num_train_images: string;
    ss_tag_frequency: {
      ["1_cate"]: Record<string, number>;
    };
  };
  activationWords: string[];
  description: string | null;
  origin: string;
  sdVersion: string;
  previewMediaItem?: MediaItemSchema;
  tags: PopulatedTag[];
  type?: "SLIDER" | "MODIFIER" | "NORMAL";
};

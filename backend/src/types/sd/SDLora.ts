import { TagTableSchema } from '../../db/vault/schema';

export type SDLora = {
  id: string;
  name: string;
  alias: string;
  path: string;
  metadata: {
    ss_sd_model_name: string;
    ss_resolution: string;
    ss_clip_skip: string;
    ss_num_train_images: string;
    ss_tag_frequency: {
      ['1_cate']: Record<string, number>
    }
  },
  previewImage: string;
  tags: TagTableSchema[],
}
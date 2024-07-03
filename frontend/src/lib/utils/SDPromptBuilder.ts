import type { SDPromptRequest } from "$lib/types/SD/SDPromptRequest";

type HighResOptions = {
  upscaler: string;
  steps: number;
  denoisingStrength: number;
  upscaleBy: number;
}

type RefinerOptions = {
  refinerCheckpoint: string;
  switchAt: number;
};

export class SDPromptBuilder {
  private promptRequest: SDPromptRequest;
  
  public constructor() {
    this.promptRequest = {
      prompt: "",
      negative_prompt: "",
      styles: [],
      seed: -1,
      subseed: -1,
      subseed_strength: 0,
      seed_resize_from_h: -1,
      seed_resize_from_w: -1,
      sampler_name: "Euler a",
      scheduler: "automatic",
      batch_size: 1,
      n_iter: 1,
      steps: 20,
      cfg_scale: 7,
      width: 512,
      height: 512,
      restore_faces: false,
      tiling: false,
      do_not_save_samples: false,
      do_not_save_grid: true,
      eta: 0,
      denoising_strength: 0.7,
      s_min_uncond: 0,
      s_churn: 0,
      s_tmax: 0,
      s_tmin: 0,
      s_noise: 0,
      override_settings: {
        CLIP_stop_at_last_layers: 2,
        sd_vae: "None",
        sd_model_checkpoint: "v1-5-pruned-emaonly",
      },
      override_settings_restore_afterwards: true,
      refiner_checkpoint: null,
      refiner_switch_at: 0,
      disable_extra_networks: false,
      firstpass_image: null,
      comments: {},
      enable_hr: false,
      firstphase_height: 0,
      firstphase_width: 0,
      hr_scale: 2,
      hr_upscaler: null,
      hr_scheduler: null,
      hr_second_pass_steps: 0,
      hr_resize_x: 0,
      hr_resize_y: 0,
      hr_checkpoint_name: null,
      hr_sampler_name: null,
      hr_prompt: "",
      hr_negative_prompt: "",
      force_task_id: "",
      sampler_index: "",
      script_name: "",
      script_args: [],
      send_images: true,
      save_images: false,
      alwayson_scripts: {},
      infotext: "",
    }
  }

  public withCheckpoint(checkpoint: string): this {
    this.promptRequest.override_settings[`sd_model_checkpoint`] = checkpoint;
    return this;
  }

  public withPositivePrompt(prompt: string): this {
    this.promptRequest.prompt = prompt;
    return this;
  }

  public withNegativePrompt(prompt: string): this {
    this.promptRequest.negative_prompt = prompt;
    return this;
  }

  public withSteps(steps: number): this {
    this.promptRequest.steps = steps;
    return this;
  }

  public withSampler(sampler: string): this {
    this.promptRequest.sampler_name = sampler;
    return this;
  }

  public withSize(width: number, height: number): this {
    this.promptRequest.width = width;
    this.promptRequest.height = height;
    return this;
  }

  public withSeed(seed: number): this {
    this.promptRequest.seed = seed;
    return this;
  }

  public withCfgScale(cfgScale: number): this {
    this.promptRequest.cfg_scale = cfgScale;
    return this;
  }

  public withHighResOptions(options: HighResOptions ): this {
    this.promptRequest.hr_upscaler = options.upscaler;
    this.promptRequest.hr_scale = options.upscaleBy;
    this.promptRequest.hr_second_pass_steps = options.steps;
    this.promptRequest.denoising_strength = options.denoisingStrength;
    
    this.promptRequest.enable_hr = true;
    return this;
  }

  public withRefiner(options: RefinerOptions): this {
    this.promptRequest.refiner_checkpoint = options.refinerCheckpoint;
    this.promptRequest.refiner_switch_at = options.switchAt;
    return this;
  }

  public build(): SDPromptRequest {
    return this.promptRequest;
  }
}
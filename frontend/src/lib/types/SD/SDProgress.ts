export type SDProgress = {
  progress: number;
  eta_relative: number;
  state: {
    skipped: boolean;
    interrupted: boolean;
    stopping_generation: boolean;
    job: string;
    job_count: number;
    job_timestamp: string;
    job_no: number;
    sampling_step: number;
    sampling_steps: number;
  };
  current_image: string;
};
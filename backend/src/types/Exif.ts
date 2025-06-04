export type ParsedExif = {
	['Image Height']: { value: number };
	['Image Width']: { value: number };
	// Automatic1111
	parameters?: {
		value: string;
		description: string;
	};
	// Civitai
	UserComment?: {
		value: number[];
	};
	// Internal sd server
	GenerationInfo: {
		value: string;
		description: string;
	};
};

export type GenerationInfoPayload = {
	positive_prompt: string;
	negative_prompt: string;
	width: number;
	height: number;
	model: string;
	sampler: string;
	seed: number;
	steps: number;
	cfg_scale: number;
};

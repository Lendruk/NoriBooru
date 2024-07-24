export type ParsedExif = {
	['Image Height']: { value: number }
	['Image Width']: { value: number }
	// Automatic1111
	parameters?: {
		value: string;
		description: string;
	};
	// Civitai
	UserComment?: {
		value: number[];
	}
};

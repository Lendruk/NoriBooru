type TagDef = {
	id: number;
	name: string;
	color: string;
	parentTagId: number | null;
};

type SimpleTag = Omit<TagDef, 'parentTagId'>;
export type PopulatedTag = SimpleTag & { parent: SimpleTag | null; subTags: PopulatedTag[] };

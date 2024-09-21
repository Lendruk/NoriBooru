import { WorldCulture } from './WorldCulture';
import { WorldSpecie } from './WorldSpecie';

export class WorldCharacter {
	public id: string;
	public name: string;
	public age: number;
	public createdAt: number;
	public updatedAt: number;
	public specie?: WorldSpecie;
	public culture?: WorldCulture;

	public constructor(
		id: string,
		name: string,
		age: number,
		createdAt: number,
		updatedAt: number,
		specie?: WorldSpecie,
		culture?: WorldCulture
	) {
		this.id = id;
		this.name = name;
		this.age = age;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.specie = specie;
		this.culture = culture;
	}
}

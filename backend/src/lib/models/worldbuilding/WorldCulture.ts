export class WorldCulture {
	public id: string;
	public name: string;
	public description: string;
	public createdAt: number;
	public updatedAt: number;

	constructor(id: string, name: string, description: string, createdAt: number, updatedAt: number) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}
}

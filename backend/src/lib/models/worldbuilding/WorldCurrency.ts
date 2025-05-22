export class WorldCurrency {

  public constructor(
    public id: string,
    public name: string,
    public description: string,
    public createdAt: number,
    public updatedAt: number,
    public weight: number
  ) { }
}
import { inject, injectable } from 'inversify';
import { VaultService } from '../../lib/VaultService';
import { VaultDb } from '../../lib/VaultInstance';
import { WorldCurrency } from '../../lib/models/worldbuilding/WorldCurrency';
import { worldCurrencies, WorldCurrencySchema } from '../../db/vault/worldBuildingSchema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@injectable()
export class CurrencyService extends VaultService {

  public constructor(
    @inject('db') db: VaultDb,
  ) {
    super(db);
  }

  public async getCurrencies(): Promise<WorldCurrency[]> {
    const rawCurrencies = await this.db.query.worldCurrencies.findMany();
    return rawCurrencies.map(currency => this.mapDbSchema(currency));
  }

  public async getCurrency(id: string): Promise<WorldCurrency> {
    const rawCurrency = await this.db.query.worldCurrencies.findFirst({ where: eq(worldCurrencies.id, id) });

    if (!rawCurrency) {
      throw new Error(`Currency with id ${id} not found`);
    }

    return this.mapDbSchema(rawCurrency);
  }

  public async deleteCurrency(id: string): Promise<void> {
    await this.db.delete(worldCurrencies).where(eq(worldCurrencies.id, id));
  }

  public async createCurrency(name: string, weight: number, description?: string): Promise<WorldCurrency> {
    const newCurrency = await this.db.insert(worldCurrencies).values({
      createdAt: Date.now(),
      updatedAt: Date.now(),
      id: randomUUID(),
      name,
      weight,
      description
    }).returning();
    return this.mapDbSchema(newCurrency[0]);
  }

  public async updateCurrency(id: string, name: string, weight: number, description?: string): Promise<WorldCurrency> {
    const updatedCurrency = await this.db.update(worldCurrencies).set({ name, weight, description, updatedAt: Date.now() }).where(eq(worldCurrencies.id, id)).returning();
    return this.mapDbSchema(updatedCurrency[0]);
  }

  private mapDbSchema(rawCurrency: WorldCurrencySchema): WorldCurrency {
    return {
      ...rawCurrency,
      description: rawCurrency.description ?? ''
    };
  }
}
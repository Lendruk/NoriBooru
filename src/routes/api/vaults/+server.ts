import { masterDb } from "$lib/server/db/master/db";
import { vaults } from "$lib/server/db/master/schema";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { v4 as uuidV4 } from 'uuid';
import fs from 'fs/promises';
import { VaultController } from "$lib/server/db/VaultController";
export const POST: RequestHandler = async ({request}) => {
  const body = await request.json();

  const vaultPath = body.path as string;

  try {
    const stats = await fs.stat(vaultPath);
  
    if (!stats.isDirectory()) {
      throw new Error("Path is not a directory");
    }
  } catch (err) {
    console.log(err);
    return error(400, { message: "Path is not a directory" })
  }

  const newVault = await masterDb.insert(vaults).values({ id: uuidV4(),  path: body.path, name: body.name }).returning();
  
  await fs.mkdir(`${vaultPath}/media`);
  await fs.mkdir(`${vaultPath}/media/images`);
  await fs.mkdir(`${vaultPath}/media/videos`);
  VaultController.registerVault(newVault[0]);
  return json(newVault);
};

export const GET: RequestHandler = async () => {
  const vaults = await masterDb.query.vaults.findMany();
  return json(vaults);
};
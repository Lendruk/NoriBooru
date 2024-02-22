import { error, type RequestHandler } from "@sveltejs/kit";
import path from 'path';
import fs from 'fs/promises';
import { VaultController } from "$lib/server/db/VaultController";

export const GET: RequestHandler = async ({ params }) => {
  const vaultId = params.vaultId;
  if(!vaultId) {
    return error(400, "Vault ID is required");
  }

  const fileName = params.fileName
  const { vault } = VaultController.getVault(vaultId);
  const imagePath = path.join(vault.path, 'media', 'images', '.thumb', `${fileName}`);
  const image = await fs.readFile(imagePath);
  return new Response(image, {
    headers: {
      'Content-Type': 'image/jpg',
    }
  });
};
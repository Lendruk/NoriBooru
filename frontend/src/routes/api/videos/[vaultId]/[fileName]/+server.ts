import { error, json, type RequestHandler } from "@sveltejs/kit";
import { Stats, createReadStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';
import { Readable } from 'node:stream';
import { VaultController } from "$lib/server/db/VaultController";

export const GET: RequestHandler = async ({ params }) => {
  const vaultId = params.vaultId;
  if(!vaultId) {
    return error(400, "Vault ID is required");
  }

  const fileName = params.fileName;
  const { vault } = VaultController.getVault(vaultId);
  const videoPath = path.join(vault.path, "media", 'videos', fileName!);
  
  let stats: Stats;
  try {
    stats = await fs.stat(videoPath);
  } catch (err) {
    console.log(err);
    return json({ status: 404, error: 'Video not found' });
  }

  const videoStream = createReadStream(videoPath);
  return new Response(Readable.toWeb(videoStream) as any, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stats.size.toString(),
    }
  });
};
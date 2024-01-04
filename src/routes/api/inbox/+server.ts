import { mediaItems } from "$lib/server/db/vault/schema";
import { json, type RequestHandler } from "@sveltejs/kit";
import fs from 'fs/promises';
import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import type { Locals } from "$lib/types/Locals";
import type { VaultInstance } from "$lib/server/db/VaultController";

function fileTypeFromExtension(extension: string) {
  switch(extension) {
    case 'mp4':
      return 'video';
    case 'webm':
      return 'video';
    case 'png':
      return 'image';
    case 'jpg':
      return 'image';
    case 'jpeg':
      return 'image'
    default:
      return null;
  }
}

const INBOX_PATH = path.join(process.cwd(), 'media', 'inbox');

export const POST: RequestHandler = async ({ locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db, vault } = vaultInstance;

  console.log(INBOX_PATH);
  const files = await fs.readdir(INBOX_PATH);
  for(const file of files) {
    console.log(file);
    const fileExtension = file.split('.').pop()!;
    const fileType = fileTypeFromExtension(fileExtension);

    if (!fileType) {
      continue;
    }
    const id = uuidV4();
    const finalPath = path.join(vault.path, "media", fileType === "image" ? "images" : "videos", `${id}.${fileExtension}`);
    await fs.rename(path.join(process.cwd(), 'media', 'inbox', file), finalPath);
    const stats = await fs.stat(finalPath);
    await db.insert(mediaItems).values({ fileName: id, extension: fileExtension, type: fileType, createdAt: Date.now(), fileSize: stats.size / (1024*1024) }).returning();
  }
  return json({ status: 200, message: "Inbox processed" });
};

export const GET: RequestHandler = async () => {
  const inboxFiles = await fs.readdir(INBOX_PATH);
  return json(inboxFiles);
};
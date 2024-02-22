import { FastifyReply, RouteOptions } from "fastify";
import { Request } from "../../types/Request";
import { db } from "../../db/vault/db";
import { playlists, playlists_mediaItems_table } from "../../db/vault/schema";
import { eq } from "drizzle-orm";

const updatePlaylist = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const params = request.params as { id: string };
  const body = request.body as { name: string, randomizeOrder: boolean, timePerItem: number, items: number[] };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  if(!params.id) {
    return reply.status(400).send({ message: "Missing id" });
  
  }

  const id = parseInt(params.id);
  // This is inefficient improve in future
  await db.delete(playlists_mediaItems_table).where(eq(playlists_mediaItems_table.playlistId, id));
  await db.update(playlists).set({ name: body.name, randomizeOrder: body.randomizeOrder ? 1 : 0, timePerItem: body.timePerItem }).where(eq(playlists.id, id));
  await db.insert(playlists_mediaItems_table).values(body.items.map((item, index) => ({ playlistId: id, mediaItemId: item, itemIndex: index }))).returning();
  return reply.send();
};

export default {
	method: 'PUT',
	url: '/playlists/:id',
	handler: updatePlaylist,
} as RouteOptions;
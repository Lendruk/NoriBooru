export type SimplePlaylist = {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number | null;
  randomizeOrder: number;
  timePerItem: number | null;
  items: number;
};
